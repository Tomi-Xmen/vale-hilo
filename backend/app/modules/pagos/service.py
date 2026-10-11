from flask import current_app
from sqlalchemy import select

from app.extensions import db
from app.modules.pagos import webpay
from app.modules.pagos.models import EstadoPago, Pago
from app.modules.reservas.service import (
    HoraNoDisponible,
    confirmar_reserva,
    esta_esperando_pago,
    obtener_reserva,
)


class ReservaNoPagable(Exception):
    pass


def iniciar_pago(reserva_id):
    """Crea la transacción en Webpay y devuelve la página donde el cliente debe pagar."""
    reserva = obtener_reserva(reserva_id)
    if reserva is None or not esta_esperando_pago(reserva):
        raise ReservaNoPagable()

    pago = Pago(reserva_id=reserva.id, monto=reserva.monto_abono)
    db.session.add(pago)
    db.session.flush()  # guarda sin terminar, para que el pago tenga id (lo usa la orden de compra)

    try:
        transaccion = webpay.iniciar_transaccion(
            orden_compra=pago.orden_compra,
            id_sesion=str(reserva.id),
            monto=pago.monto,
            url_retorno=f"{current_app.config['URL_PUBLICA']}/api/pagos/retorno",
        )
    except webpay.ErrorWebpay:
        db.session.rollback()
        raise

    pago.token = transaccion.token
    db.session.commit()
    return transaccion


def procesar_retorno(token_ws, tbk_token, tbk_id_sesion):
    """Procesa la vuelta del cliente desde Webpay y devuelve el pago (o None si no se encuentra).

    Webpay indica qué pasó según los parámetros que manda:
    - solo token_ws: el cliente terminó el formulario; hay que confirmar el resultado.
    - TBK_TOKEN: el cliente canceló el pago (o hubo un error en el formulario).
    - solo TBK_ID_SESION: se acabó el tiempo para pagar.
    """
    if token_ws and not tbk_token:
        pago = _buscar_pago_por_token(token_ws)
        if pago is not None:
            _confirmar_pago(pago)
        return pago

    if tbk_token:
        pago = _buscar_pago_por_token(tbk_token)
    else:
        pago = _buscar_pago_iniciado_de_reserva(tbk_id_sesion)

    if pago is not None and pago.estado == EstadoPago.INICIADO:
        pago.estado = EstadoPago.RECHAZADO
        db.session.commit()
    return pago


def _confirmar_pago(pago):
    # Si el cliente recarga la página de retorno, el pago ya está procesado: no se repite.
    if pago.estado != EstadoPago.INICIADO:
        return

    try:
        resultado = webpay.confirmar_transaccion(pago.token)
    except webpay.ErrorWebpay:
        resultado = None

    if resultado is None or not resultado.aprobado:
        pago.estado = EstadoPago.RECHAZADO
        db.session.commit()
        return

    pago.estado = EstadoPago.APROBADO
    pago.codigo_autorizacion = resultado.codigo_autorizacion
    pago.ultimos_digitos_tarjeta = resultado.ultimos_digitos_tarjeta

    try:
        confirmar_reserva(obtener_reserva(pago.reserva_id))
    except HoraNoDisponible:
        # Pagó después de que expiró el bloqueo y alguien más tomó la hora.
        _devolver_dinero(pago)


def _devolver_dinero(pago):
    try:
        webpay.reembolsar(pago.token, pago.monto)
    except webpay.ErrorWebpay:
        # El pago queda aprobado sin reserva: alguien tiene que revisarlo a mano.
        current_app.logger.error("No se pudo reembolsar el pago %s", pago.id)
        db.session.commit()
        return

    pago.estado = EstadoPago.REEMBOLSADO
    db.session.commit()


def _buscar_pago_por_token(token):
    return db.session.scalars(select(Pago).where(Pago.token == token)).first()


def _buscar_pago_iniciado_de_reserva(reserva_id):
    if not reserva_id or not reserva_id.isdigit():
        return None
    consulta = (
        select(Pago)
        .where(Pago.reserva_id == int(reserva_id), Pago.estado == EstadoPago.INICIADO)
        .order_by(Pago.id.desc())
    )
    return db.session.scalars(consulta).first()

import { describe, expect, it } from 'vitest'
import { aFechaISO, desdeISO, formatFechaLarga, formatHora, sumarDias } from './fechas'
import { formatDuracion, formatPrecio } from './format'

describe('fechas', () => {
  it('convierte a texto usando el día local, sin correrse por la zona horaria', () => {
    // A las 23:30 en Chile ya es el día siguiente en UTC: no debe cambiar de día.
    expect(aFechaISO(new Date(2026, 9, 12, 23, 30))).toBe('2026-10-12')
  })

  it('suma días pasando al mes siguiente', () => {
    expect(aFechaISO(sumarDias(new Date(2026, 9, 30), 3))).toBe('2026-11-02')
  })

  it('lee fechas del backend en hora local', () => {
    const fecha = desdeISO('2026-10-12')
    expect(fecha.getDate()).toBe(12)
    expect(formatFechaLarga(fecha)).toMatch(/lunes, 12 de octubre/i)
    expect(desdeISO('2026-10-12T10:30:00').getHours()).toBe(10)
  })

  it('muestra las horas en formato de 24 horas', () => {
    expect(formatHora(new Date(2026, 9, 12, 20, 10))).toBe('20:10')
    expect(formatHora(new Date(2026, 9, 12, 9, 0))).toBe('09:00')
  })
})

describe('formato de precios y duraciones', () => {
  it('muestra pesos chilenos con punto de miles', () => {
    expect(formatPrecio(15000)).toBe('$15.000')
  })

  it('muestra la duración en palabras', () => {
    expect(formatDuracion(45)).toBe('45 min')
    expect(formatDuracion(60)).toBe('1 h')
    expect(formatDuracion(90)).toBe('1 h 30 min')
  })
})

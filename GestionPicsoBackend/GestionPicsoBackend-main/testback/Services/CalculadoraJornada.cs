// CalculadoraJornada.cs
using System;
using System.Collections.Generic;
using System.Linq;
using testback.Models;

namespace testback.Services
{
    public class CalculadoraJornada
    {
        /// <summary>
        /// Calcula la jornada de un empleado para una fecha determinada,
        /// procesando todos los ingresos y salidas (primario y adicionales).
        /// </summary>
    
    private List<(DateTime entrada, DateTime salida)> EmparejarTurnos(
    List<DateTime> ingresos,
    List<DateTime> salidas)
{
    var pares = new List<(DateTime entrada, DateTime salida)>();

    var queueSalidas = new Queue<DateTime>(salidas.OrderBy(s => s));

    foreach (var ent in ingresos.OrderBy(i => i))
    {
        DateTime? salidaAsignada = null;

        while (queueSalidas.Count > 0)
        {
            var cand = queueSalidas.Peek();

            if (cand > ent)
            {
                salidaAsignada = queueSalidas.Dequeue();
                break;
            }

            queueSalidas.Dequeue();
        }

        if (salidaAsignada != null)
        {
            pares.Add((ent, salidaAsignada.Value));
        }
    }

    return pares;
}

   public RegistroJornada CalcularRegistro(
    Empleado empleado,
    List<IngresosPersonal> ingresos,
    List<SalidasPersonal> salidas,
    List<DateTime> diasFestivos)
{
    var fecha = ingresos.Select(i => i.FechaHoraEntrada.Date).FirstOrDefault();

    var reg = new RegistroJornada
    {
        NombreCompleto = empleado.NombreCompleto,
        Ubicacion = empleado.Ubicacion,
        Fecha = fecha,
        TrabajoDomingo = fecha.DayOfWeek == DayOfWeek.Sunday,
        TrabajoFestivo = diasFestivos.Contains(fecha)
    };

    var entradas = ingresos.Select(i => i.FechaHoraEntrada).OrderBy(d => d).ToList();
    var salidasOrdered = salidas.Select(s => s.FechaHoraSalida).OrderBy(d => d).ToList();
    var pares = EmparejarTurnos(entradas, salidasOrdered);

    var inicioDiurno = new TimeSpan(6, 0, 0);
    var finDiurno = new TimeSpan(21, 0, 0);

    // Detectar si el turno cruza mañana y tarde
bool cruzaMananaTarde = 
    entradas.First().TimeOfDay < new TimeSpan(12, 0, 0) &&
    salidasOrdered.Last().TimeOfDay > new TimeSpan(14, 0, 0);

List<(TimeSpan inicio, TimeSpan fin)> descansos;

if (cruzaMananaTarde)
{
    // Turno AM + PM → se descuentan 1.5 h
    descansos = new()
    {
        (new TimeSpan(9, 0, 0), new TimeSpan(9, 30, 0)),
        (new TimeSpan(13, 0, 0), new TimeSpan(14, 0, 0))
    };
}
else
{
    // Turno solo PM o nocturno → se descuenta solo 1 h de almuerzo
    descansos = new()
    {
        (new TimeSpan(13, 0, 0), new TimeSpan(14, 0, 0))
    };
}


    double diurnas = 0, nocturnas = 0;
    double extrasDiurnas = 0, extrasNocturnas = 0;
    double extrasDomDiurnas = 0, extrasDomNocturnas = 0;
    double dominicales = 0, noctDom = 0;
    double acumuladoNormal = 0;

    foreach (var (entrada, salida) in pares)
    {
        var inicio = entrada;
        var fin = salida <= entrada ? salida.AddDays(1) : salida;

        var cursor = inicio;
        while (cursor < fin)
        {
            var next = cursor.AddMinutes(10);
            if (next > fin) next = fin;

            var t0 = cursor.TimeOfDay;
                    var t1 = next.TimeOfDay;


                
            if (descansos.Any(d => t0 < d.fin && t1 > d.inicio))
            {
                cursor = next;
                continue;
            }

            var horas = (next - cursor).TotalHours;
            bool esDiurno = t0 >= inicioDiurno && t0 < finDiurno;
            bool esDomingo = cursor.DayOfWeek == DayOfWeek.Sunday;
            bool esFestivo = diasFestivos.Contains(cursor.Date);

            // --- Clasificación base ---
            if (acumuladoNormal < 8 && !esDomingo && !esFestivo)
            {
                var faltan = 8 - acumuladoNormal;
                var normales = Math.Min(horas, faltan);
                var extras = horas - normales;

                if (esDiurno)
                    diurnas += normales;
                else
                    nocturnas += normales;

                if (esDiurno)
                    extrasDiurnas += extras;
                else
                    extrasNocturnas += extras;

                acumuladoNormal += normales;
            }
            else
            {
                // domingo o festivo
                if (esDomingo || esFestivo)
                {
                    if (esDiurno)
                        extrasDomDiurnas += horas;
                    else
                        extrasDomNocturnas += horas;
                }
                else
                {
                    if (esDiurno)
                        extrasDiurnas += horas;
                    else
                        extrasNocturnas += horas;
                }
            }

            // Para totales dominicales normales (no extras)
            if (esDomingo || esFestivo)
            {
                if (esDiurno)
                    dominicales += horas;
                else
                    noctDom += horas;
            }

            cursor = next;
        }
    }

    reg.HoraEntrada = entradas.FirstOrDefault();
    reg.HoraSalida = salidasOrdered.LastOrDefault();
    reg.HorasDiurnas = Math.Round(diurnas, 2);
    reg.HorasNocturnas = Math.Round(nocturnas, 2);
    reg.HorasExtrasDiurnas = Math.Round(extrasDiurnas, 2);
    reg.HorasExtrasNocturnas = Math.Round(extrasNocturnas, 2);
    reg.HorasDominicales = Math.Round(dominicales, 2);
    reg.HorasRecargoNocturnoDominical = Math.Round(noctDom, 2);
    reg.HorasExtrasDominicales = Math.Round(extrasDomDiurnas + extrasDomNocturnas, 2);
    reg.HorasTrabajadas = Math.Round(diurnas + nocturnas + extrasDiurnas + extrasNocturnas + dominicales + noctDom + extrasDomDiurnas + extrasDomNocturnas, 2);

    return reg;
}




         public List<Tiempo> ObtenerTiemposAdicionales(RegistroJornada reg)
    {
        var lista = new List<Tiempo>();

        if (reg.HorasExtrasDiurnas > 0)
        {
            var inicio = reg.HoraEntrada.AddHours(8); // después de 8 horas normales
            var fin = inicio.AddHours(reg.HorasExtrasDiurnas);
            lista.Add(new Tiempo
            {
                nombreEmpleado = reg.NombreCompleto,
                fechaHoraEntrada = inicio,
                fechaHoraSalida = fin
            });
        }

        if (reg.HorasExtrasNocturnas > 0)
        {
            var inicio = reg.HoraSalida.AddHours(-reg.HorasExtrasNocturnas); // antes de la salida
            var fin = reg.HoraSalida;
            lista.Add(new Tiempo
            {
                nombreEmpleado = reg.NombreCompleto,
                fechaHoraEntrada = inicio,
                fechaHoraSalida = fin
            });
        }

        return lista;
    }
    }
}

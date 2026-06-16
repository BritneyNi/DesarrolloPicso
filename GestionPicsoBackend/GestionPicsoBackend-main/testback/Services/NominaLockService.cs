using System;
using System.Security.Claims;

namespace testback.Services
{
    public class NominaLockService
    {
        private static readonly TimeZoneInfo ZonaColombia =
            TimeZoneInfo.FindSystemTimeZoneById("America/Bogota");

        private static readonly int[] DiasDeCierre = { 11, 27 };
        private static readonly TimeSpan HoraDeBloqueoCierre = new TimeSpan(8, 0, 0);

        public bool EstaBloqueda(DateTime fechaObjetivo, ClaimsPrincipal? usuario = null)
        {
            if (EsAdmin(usuario)) return false;

            DateTime ahoraColombia = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, ZonaColombia);
            DateTime fechaObjetivoSoloFecha = fechaObjetivo.Date;

            if (fechaObjetivoSoloFecha >= ahoraColombia.Date)
                return false;

            bool esHoyDiaDeCierre = Array.IndexOf(DiasDeCierre, ahoraColombia.Day) >= 0;
            if (!esHoyDiaDeCierre) return false;

            return ahoraColombia.TimeOfDay >= HoraDeBloqueoCierre;
        }

        public string MensajeDeBloqueoCierre()
        {
            return "Los horarios de fechas anteriores se encuentran bloqueados después del " +
                   "corte de nómina. Comuníquese con Recursos Humanos.";
        }

        private bool EsAdmin(ClaimsPrincipal? usuario)
        {
            if (usuario == null) return false;
            var rol = usuario.FindFirst(ClaimTypes.Role)?.Value;
            return string.Equals(rol, "admin", StringComparison.OrdinalIgnoreCase);
        }
    }
}
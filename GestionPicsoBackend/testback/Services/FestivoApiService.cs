using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace testback.Services
{
    public class FestivoApiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _baseUrl;

        private readonly Dictionary<int, List<DateTime>> _cacheFestivos = new();

        public FestivoApiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["Calendarific:ApiKey"];
            _baseUrl = configuration["Calendarific:BaseUrl"];
        }

        public async Task<List<DateTime>> ObtenerFestivosColombia(int year, bool forzarActualizacion = false)
        {
            if (!forzarActualizacion && _cacheFestivos.TryGetValue(year, out var festivos))
            {
                return festivos;
            }

            var url = $"{_baseUrl}/holidays?api_key={_apiKey}&country=CO&year={year}";
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            using var stream = await response.Content.ReadAsStreamAsync();
            using var doc = await JsonDocument.ParseAsync(stream);

            var fechas = new List<DateTime>();
            var holidays = doc.RootElement
                              .GetProperty("response")
                              .GetProperty("holidays");

            foreach (var holiday in holidays.EnumerateArray())
            {
                var dateStr = holiday
                              .GetProperty("date")
                              .GetProperty("iso")
                              .GetString();

                if (DateTime.TryParse(dateStr, out var fecha))
                    fechas.Add(fecha.Date);
            }
            _cacheFestivos[year] = fechas;

            return fechas;
        }
    }
}

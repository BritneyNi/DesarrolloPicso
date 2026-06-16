using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace testback.Services.Pdf
{
    public class EntregaEppEmpleadoPdfService
    {
        private readonly IWebHostEnvironment _env;
        private readonly IHttpClientFactory _httpFactory;

        public EntregaEppEmpleadoPdfService(IWebHostEnvironment env, IHttpClientFactory httpFactory)
        {
            _env = env;
            _httpFactory = httpFactory;
        }

        private string LogoPath => Path.Combine(_env.ContentRootPath, "Assets", "Logo", "Logopicso.png");

        private async Task<byte[]?> DescargarImagen(string? url)
        {
            if (string.IsNullOrWhiteSpace(url) || url == "pendiente") return null;
            try { return await _httpFactory.CreateClient().GetByteArrayAsync(url); }
            catch (Exception ex) { Console.WriteLine($"Error imagen {url}: {ex.Message}"); return null; }
        }

        private void BuildHeader(PageDescriptor page, string titulo)
        {
            page.Header()
                .Background(PicsoColors.Alloy)
                .PaddingHorizontal(20).PaddingVertical(8)
                .Row(row =>
                {
                    row.ConstantItem(46).AlignMiddle().Element(c =>
                    {
                        if (File.Exists(LogoPath)) c.Image(LogoPath).FitArea();
                    });
                    row.ConstantItem(10);
                    row.RelativeItem().AlignMiddle().AlignCenter().Column(col =>
                    {
                        col.Item().AlignCenter()
                            .Text(titulo).FontSize(13).Bold().FontColor(PicsoColors.White);
                        col.Item().AlignCenter()
                            .Text($"Generado: {DateTime.Now:dd/MM/yyyy  HH:mm}")
                            .FontSize(8).FontColor(PicsoColors.Arena);
                    });
                    row.ConstantItem(56);
                });
        }

        private void BuildFooter(PageDescriptor page, string subtitulo)
        {
            page.Footer()
                .Background(PicsoColors.Basalt)
                .PaddingHorizontal(20).PaddingVertical(6)
                .Row(row =>
                {
                    row.RelativeItem().AlignMiddle()
                        .Text($"PICSO INGENIERÍA  ·  {subtitulo}")
                        .FontSize(7).FontColor(PicsoColors.Green);
                    row.ConstantItem(80).AlignRight().AlignMiddle()
                        .Text(t =>
                        {
                            t.Span("Pág. ").FontSize(7).FontColor(PicsoColors.White);
                            t.CurrentPageNumber().FontSize(7).FontColor(PicsoColors.White);
                        });
                });
        }

        public async Task<byte[]> Generar(List<EntregaEmpleadoActaPdfDto> actas)
        {
            var nombreEmpleado = actas.FirstOrDefault()?.EmpleadoNombre ?? "Empleado";

            // Descargar todas las firmas antes de construir el documento
            var firmas = new Dictionary<int, (byte[]? emp, byte[]? resp)>();
            foreach (var acta in actas)
            {
                var emp  = await DescargarImagen(acta.FirmaEmpleadoUrl);
                var resp = await DescargarImagen(acta.FirmaResponsableUrl);
                firmas[acta.ActaId] = (emp, resp);
            }

            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(0);
                    BuildHeader(page, $"Historial de Dotación — {nombreEmpleado}");
                    BuildFooter(page, "Historial EPP empleado");

                    page.Content().PaddingHorizontal(20).PaddingTop(10).Column(col =>
                    {
                        col.Spacing(20);
                        foreach (var acta in actas)
                        {
                            var (firmaEmp, firmaResp) = firmas.GetValueOrDefault(acta.ActaId);
                            col.Item().Element(c => ActaBlock(c, acta, firmaEmp, firmaResp));
                        }
                    });
                });
            }).GeneratePdf();
        }

        void ActaBlock(IContainer container, EntregaEmpleadoActaPdfDto acta,
                       byte[]? firmaEmpleado, byte[]? firmaResponsable)
        {
            container.Column(col =>
            {
                col.Spacing(6);
                col.Item().LineHorizontal(1).LineColor(PicsoColors.Alloy);

                col.Item().Row(row =>
                {
                    row.RelativeItem()
                        .Text(t =>
                        {
                            t.Span($"ACTA #{acta.ActaId}").Bold().FontSize(10).FontColor(PicsoColors.Basalt);
                            t.Span($"  —  {acta.FechaEntrega:dd/MM/yyyy HH:mm}").FontSize(9).FontColor(PicsoColors.Alloy);
                        });
                });

                col.Item().Background(PicsoColors.LightBg)
                    .Border(0.5f).BorderColor("#E0E0E0").Padding(8)
                    .Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("EMPLEADO").Bold().FontSize(8).FontColor(PicsoColors.Alloy);
                            c.Item().PaddingTop(3).Text($"{acta.EmpleadoNombre}").FontSize(9).FontColor(PicsoColors.Basalt);
                            c.Item().Text($"Cédula: {acta.EmpleadoCedula}").FontSize(9).FontColor(PicsoColors.Basalt);
                            c.Item().Text($"Cargo: {acta.EmpleadoCargo}").FontSize(9).FontColor(PicsoColors.Basalt);
                        });
                        row.ConstantItem(1).Background("#E0E0E0");
                        row.ConstantItem(8);
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("RESPONSABLE").Bold().FontSize(8).FontColor(PicsoColors.Alloy);
                            c.Item().PaddingTop(3).Text($"{acta.ResponsableNombre}").FontSize(9).FontColor(PicsoColors.Basalt);
                            c.Item().Text($"Cédula: {acta.ResponsableCedula}").FontSize(9).FontColor(PicsoColors.Basalt);
                            c.Item().Text($"Cargo: {acta.ResponsableCargo}").FontSize(9).FontColor(PicsoColors.Basalt);
                            if (!string.IsNullOrWhiteSpace(acta.LugarEntrega))
                                c.Item().Text($"Lugar: {acta.LugarEntrega}").FontSize(9).FontColor(PicsoColors.Basalt);
                        });
                    });

                col.Item().Element(c => TablaElementos(c, acta.Elementos));

                // 🔹 FIRMAS
                col.Item().PaddingTop(16).Row(row =>
                {
                    Firma(row.RelativeItem(), "Firma empleado",    firmaEmpleado);
                    Firma(row.RelativeItem(), "Firma responsable", firmaResponsable);
                });
            });
        }

        void TablaElementos(IContainer container, List<EntregaEmpleadoElementoPdfDto> elementos)
        {
            container.Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.RelativeColumn();
                    cols.ConstantColumn(80);
                    cols.ConstantColumn(70);
                    cols.ConstantColumn(60);
                    cols.ConstantColumn(80);
                    cols.ConstantColumn(80);
                });

                foreach (var label in new[] { "Elemento", "Tipo", "Talla", "Cantidad", "Estado", "Fecha entrega" })
                    table.Cell().Background(PicsoColors.Basalt)
                        .BorderBottom(2).BorderColor(PicsoColors.Green)
                        .PaddingVertical(5).PaddingHorizontal(4)
                        .Text(label).FontSize(7.5f).Bold().FontColor(PicsoColors.White);

                bool alt = false;
                foreach (var e in elementos)
                {
                    var bg = alt ? PicsoColors.LightBg : PicsoColors.White; alt = !alt;
                    table.Cell().Background(bg).PaddingVertical(4).PaddingHorizontal(4).Text(e.Elemento).FontSize(8).FontColor(PicsoColors.Basalt);
                    table.Cell().Background(bg).PaddingVertical(4).PaddingHorizontal(4).Text(e.Tipo).FontSize(8).FontColor(PicsoColors.Basalt);
                    table.Cell().Background(bg).PaddingVertical(4).PaddingHorizontal(4).Text(e.Talla).FontSize(8).FontColor(PicsoColors.Basalt);
                    table.Cell().Background(bg).PaddingVertical(4).AlignCenter().Text(e.Cantidad.ToString()).FontSize(8).FontColor(PicsoColors.Basalt);
                    table.Cell().Background(bg).PaddingVertical(4).AlignCenter().Text(e.Estado).FontSize(8).FontColor(PicsoColors.Basalt);
                    table.Cell().Background(bg).PaddingVertical(4).AlignCenter().Text(e.FechaEntrega.ToString("dd/MM/yyyy")).FontSize(8).FontColor(PicsoColors.Alloy);
                }
            });
        }

        void Firma(IContainer container, string titulo, byte[]? imagen)
        {
            container.Column(col =>
            {
                col.Item().Text(titulo).FontSize(8).SemiBold().FontColor(PicsoColors.Alloy);
                if (imagen != null)
                    col.Item().Height(80).AlignCenter().Image(imagen).FitArea();
                else
                    col.Item().Height(80).AlignCenter().Border(0.5f).BorderColor("#E0E0E0")
                        .AlignMiddle().Text("Pendiente de firma").FontSize(8).Italic().FontColor(PicsoColors.Alloy);
            });
        }
    }
}
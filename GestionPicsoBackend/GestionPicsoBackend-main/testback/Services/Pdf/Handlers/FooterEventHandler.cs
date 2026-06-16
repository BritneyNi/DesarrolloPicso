using iText.Kernel.Colors;

using iText.Kernel.Font;
using iText.Kernel.Geom;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas;
using iText.Kernel.Pdf.Event;

namespace testback.Services.Pdf.Handlers
{
    public class FooterEventHandler : AbstractPdfDocumentEventHandler
    {
        private static readonly DeviceRgb C_BORDER   = new(200, 200, 200);
        private static readonly DeviceRgb C_TEXT_MID = new(120, 120, 120);

        private readonly PdfFont _font;

        public FooterEventHandler(PdfFont font)
        {
            _font = font;
        }

        protected override void OnAcceptedEvent(AbstractPdfDocumentEvent @event)
        {
            var docEvent = (PdfDocumentEvent)@event;
            var pdf      = docEvent.GetDocument();
            var page     = docEvent.GetPage();
            var pageNum  = pdf.GetPageNumber(page);
            var total    = pdf.GetNumberOfPages();
            var pageSize = page.GetPageSize();

            var canvas = new PdfCanvas(page.NewContentStreamAfter(), page.GetResources(), pdf);

            float lineY = pageSize.GetBottom() + 22;
            float left  = 30;
            float right = pageSize.GetWidth() - 30;

            // Línea separadora
            canvas.SetStrokeColor(C_BORDER)
                  .SetLineWidth(0.5f)
                  .MoveTo(left, lineY)
                  .LineTo(right, lineY)
                  .Stroke();

            float textY = lineY - 8;

            // Texto izquierda
            canvas.BeginText()
                  .SetFontAndSize(_font, 7.5f)
                  .SetColor(C_TEXT_MID, true)
                  .MoveText(left, textY)
                  .ShowText("PICSO INGENIERÍA  ·  Evaluación Trabajo en Alturas")
                  .EndText();

            // Texto derecha — paginación
            var pagText = $"Pág. {pageNum}";
            float textW = _font.GetWidth(pagText, 7.5f);
            canvas.BeginText()
                  .SetFontAndSize(_font, 7.5f)
                  .SetColor(C_TEXT_MID, true)
                  .MoveText(right - textW, textY)
                  .ShowText(pagText)
                  .EndText();

            canvas.Release();
        }
    }
}


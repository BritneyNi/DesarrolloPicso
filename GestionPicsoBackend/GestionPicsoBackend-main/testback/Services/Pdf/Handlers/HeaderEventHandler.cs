using iText.Kernel.Pdf.Event;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas;
using iText.Layout;
using iText.Layout.Element;

namespace testback.Services.Pdf.Handlers
{
    public class HeaderEventHandler : AbstractPdfDocumentEventHandler
    {
        private readonly Table _header;

        public HeaderEventHandler(Table header)
        {
            _header = header;
        }

        protected override void OnAcceptedEvent(AbstractPdfDocumentEvent @event)
        {
            var docEvent = (PdfDocumentEvent)@event;
            var pdf = docEvent.GetDocument();
            var page = docEvent.GetPage();

            var canvas = new Canvas(
                new PdfCanvas(page.NewContentStreamBefore(), page.GetResources(), pdf),
                page.GetPageSize()
            );

            canvas.Add(_header);
            canvas.Close();
        }
    }
}
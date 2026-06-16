using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Event;
using iText.Kernel.Pdf.Canvas;

public class BorderEventHandler : AbstractPdfDocumentEventHandler
{
   protected override void OnAcceptedEvent(AbstractPdfDocumentEvent currentEvent)
    {
        var docEvent = (PdfDocumentEvent)currentEvent;
        var page = docEvent.GetPage();

        var canvas = new PdfCanvas(page);
        var pageSize = page.GetPageSize();

        float margin = 1;
//
        canvas
            .SetLineWidth(1)
            .Rectangle(
                pageSize.GetLeft() + margin,
                pageSize.GetBottom() + margin,
                pageSize.GetWidth() - (margin * 2),
                pageSize.GetHeight() - (margin * 2)
            )
            .Stroke();
    }
}
public class CarteraClientePreviewDto
{
    public string Identificacion { get; set; }
    public string Cliente { get; set; }
    public decimal CarteraVencida { get; set; }
    public decimal PorVencer { get; set; }
    public decimal SaldoAFavor { get; set; }
    public bool EsFilaTotal { get; set; }
}

public class AnticipoClientePreviewDto
{
    public string Identificacion { get; set; }
    public string Cliente { get; set; }
    public decimal Anticipo { get; set; }
    public bool EsFilaTotal { get; set; }
}
public class CarteraClienteExportDto
{
    public string Identificacion { get; set; }
    public string Cliente { get; set; }
    public decimal Vencido { get; set; }
    public decimal PorVencer { get; set; }
    public decimal SaldoAFavor { get; set; }
    public bool EsFilaTotal { get; set; }
}

public class AnticipoClienteExportDto
{
    public string Identificacion { get; set; }
    public string Cliente { get; set; }
    public decimal Anticipo { get; set; }
    public bool EsFilaTotal { get; set; }
}

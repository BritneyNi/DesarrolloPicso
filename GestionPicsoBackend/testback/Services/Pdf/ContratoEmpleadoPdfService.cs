using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace testback.Services.Pdf
{
    public class ContratoEmpleadoPdfService
    {

    private readonly IWebHostEnvironment _env;
    private const decimal TOPE_AUXILIO_TRANSPORTE = 3_400_000;

     public ContratoEmpleadoPdfService(IWebHostEnvironment env)
        {
            _env = env;
        }

      public byte[] GenerarContrato(Empleado empleado)
    {
    var document = Document.Create(container =>
    {
        container.Page(page =>
        {
            // Estilo por defecto dentro de Page
            page.DefaultTextStyle(x =>
            {
                x.FontFamily("Arial");
                x.FontSize(11);
                x.FontColor(Colors.Black);
                return x;
            });

            page.Margin(40);

            page.Header().Element(c => Header(c, empleado));
            page.Background().Element(MarcaDeAgua);
            page.Content().Element(c => Body(c, empleado));

            page.Footer().AlignCenter().Text(x =>
            {
                x.Span("Página ");
                x.CurrentPageNumber();
                x.Span(" de ");
                x.TotalPages();
            });
        });
    });

    return document.GeneratePdf();
}

        

 private byte[]? ObtenerLogo()
{
    var path = Path.Combine(
        _env.ContentRootPath,
        "Assets",
        "Logo",
        "Logopicso.png"
    );

    return File.Exists(path) ? File.ReadAllBytes(path) : null;
}

        // ---------------- HEADER ----------------
    private void Header(IContainer container, Empleado e)
{
    var logo = ObtenerLogo();

    container.Column(column =>
    {
        column.Spacing(5);

        // ================= FILA SUPERIOR =================
        column.Item().Row(row =>
        {
            // 🔹 LOGO
            if (logo != null)
            {
                row.ConstantItem(90)
                   .AlignMiddle()
                   .Image(logo);
            }

            // 🔹 DATOS EMPRESA (CENTRO)
            row.RelativeItem().AlignMiddle().Column(col =>
            {
                col.Item().AlignCenter().Text("PICSO S.A.S")
                    .FontSize(16)
                    .Bold();

                col.Item().AlignCenter().Text("NIT: 800241427-7")
                    .FontSize(10);

                col.Item().AlignCenter()
                    .Text("Carrera 51 #12 Sur - 69, Guayabal")
                    .FontSize(9);

                col.Item().AlignCenter()
                    .Text("Medellín - Antioquia")
                    .FontSize(9);
            });

            // 🔹 BLOQUE DOCUMENTAL (DERECHA)
            row.ConstantItem(130)
               .AlignMiddle()
               .AlignRight()
               .Column(col =>
               {
                   col.Item().Text("Código: GD-FR-03")
                       .FontSize(8);

                   col.Item().Text("Versión: 1.2")
                       .FontSize(8);

                   col.Item().Text("Fecha: 11/07/2025")
                       .FontSize(8);
               });
        });

        // ================= TÍTULO =================
        column.Item()
              .PaddingTop(8)
              .AlignCenter()
              .Text($"CONTRATO DE TRABAJO {e.TipoContrato?.ToUpper()}")
              .FontSize(14)
              .Bold();

        // ================= LÍNEA =================
        column.Item()
              .PaddingTop(6)
              .LineHorizontal(1);
    });
}

private string TieneAuxilioTransporte(Empleado e)
{
    if (!e.Salario.HasValue)
        return "No definido";

    return e.Salario.Value <= TOPE_AUXILIO_TRANSPORTE
        ? "Sí"
        : "No";
}


// ---------------- BODY ----------------
private void Body(IContainer container, Empleado e)
{
    container.Column(column =>
    {
        column.Spacing(12);

        // ================= INTRO =================
        column.Item().Text(text =>
        {
            text.Span("Entre los suscritos, ").FontSize(11);
            text.Span("PICSO S.A.S").Bold().FontSize(11);
            text.Span(" y el señor(a) ").FontSize(11);
            text.Span(e.NombreCompleto).Bold().FontSize(11);
            text.Span(", identificado(a) con cédula No. ").FontSize(11);
            text.Span(e.Cedula).Bold().FontSize(11);
            text.Span(", se celebra el presente contrato de trabajo bajo las siguientes condiciones:").FontSize(11);
        });

        // ================= DATOS EMPLEADO =================
        column.Item().PaddingTop(8)
            .Text("DATOS DEL EMPLEADO")
            .Bold()
            .FontSize(12);

        column.Item().Table(table =>
        {
            table.ColumnsDefinition(c =>
            {
                c.RelativeColumn(1);
                c.RelativeColumn(2);
            });

            Fila(table, "Nombre completo:", e.NombreCompleto);
            Fila(table, "Cédula:", e.Cedula);
            Fila(table, "Dirección:", e.Direccion);
            Fila(table, "Teléfono:", e.Telefono ?? "No registra");
            Fila(table, "Correo electrónico:", e.Correo ?? "No registra");
        });

        // ================= CONDICIONES =================
        column.Item().PaddingTop(8)
            .Text("CONDICIONES ESPECIALES")
            .Bold()
            .FontSize(12);

        column.Item().Table(table =>
        {
            table.ColumnsDefinition(c =>
            {
                c.RelativeColumn(1);
                c.RelativeColumn(2);
            });

           Fila(table, "Cargo:", e.Cargo);
Fila(table, "Exclusividad:", "Sí");
Fila(table, "Fecha de inicio:", e.FechaInicioContrato?.ToString("yyyy-MM-dd") ?? "N/A");

bool esIndefinido = e.TipoContrato?.Equals("Indefinido", StringComparison.OrdinalIgnoreCase) == true;

if (esIndefinido)
{
    Fila(table, "Periodo de prueba:", "2 meses");
}
else
{
    Fila(table, "Periodo de prueba:", "18 días");
    Fila(table, "Fecha de terminación:", e.FechaRetiro?.ToString("yyyy-MM-dd") ?? "Según finalización de obra");
    Fila(table, "Obra:", e.Obra ?? "No registra");
}

Fila(table, "Lugar de suscripción:", "Medellín");

        });

        // ================= PAGOS =================
        column.Item().PaddingTop(8)
            .Text("REMUNERACIÓN")
            .Bold()
            .FontSize(12);

        column.Item().Table(table =>
        {
            table.ColumnsDefinition(c =>
            {
                c.RelativeColumn(1);
                c.RelativeColumn(2);
            });

            Fila(
                table,
                "Salario:",
                e.Salario.HasValue
                    ? $"${e.Salario:N0} ({NumeroALetras(e.Salario.Value)})"
                    : "No definido"
            );

            Fila(
    table,
    "Auxilio de transporte:",
    TieneAuxilioTransporte(e)
);

            Fila(table, "Pagos extralegales:", "No");
        });

        // ================= CLAUSULADO =================
column.Item().PaddingTop(10)
    .Text("CLÁUSULAS DEL CONTRATO")
    .Bold()
    .FontSize(12);

column.Item().Text(text =>
{
    text.Span("Este contrato ha sido redactado estrictamente de acuerdo con la ley y la jurisprudencia y será interpretado de buena fe y en consonancia con el Código Sustantivo del Trabajo cuyo objeto, definido en su artículo 1º, es lograr la justicia en las relaciones entre EMPLEADORES y TRABAJADORES dentro de un espíritu de coordinación económica y equilibrio social. Entre EL EMPLEADOR y EL TRABAJADOR, identificados y bajo las condiciones ya mencionadas, hemos decidido celebrar el presente ");
    text.Span($"CONTRATO LABORAL {e.TipoContrato} ").Bold();
    text.Span(", el cual será regido por las siguientes cláusulas:\n\n");
});

void Clausula(string titulo, string contenido)
{
    column.Item().Text(t =>
    {
        t.Span(titulo).Bold();
        t.Span(" " + contenido);
    });
}

// PRIMERO
Clausula(
    "PRIMERO. OBJETO Y FUNCIONES:",
    "EL EMPLEADOR contrata los servicios personales del TRABAJADOR, que se encuentran especificadas en el Manual de Cargos y Funciones, que se le entrega con el presente contrato, por lo que se entiende que hace parte integral de este contrato y deberá tenerlo en cuenta para la organización administrativa siguiente el conducto regular con su personal a cargo, jefe inmediato y su área de dependencia."
);

column.Item().Text(t =>
{
    t.Span("Parágrafo: ").Bold();
    t.Span("El incumplimiento de cualquiera de las obligaciones contenidas en este artículo constituye justa causa para la terminación del contrato.\n\n");
});

// SEGUNDO
Clausula(
    "SEGUNDO. REMUNERACIÓN:",
    "EL EMPLEADOR pagará al TRABAJADOR por la prestación de sus servicios el monto establecido en el contrato, pagadero en las oportunidades señaladas en el encabezado. Dentro de este pago se encuentra incluida la remuneración de los descansos dominicales y festivos de que tratan los capítulos I y II del título VII del Código Sustantivo del Trabajo."
);

column.Item().Text(t =>
{
    t.Span("Parágrafo primero: ").Bold();
    t.Span("Las partes expresamente acuerdan que los beneficios o auxilios habituales u ocasionales, otorgados en forma legal o extralegal, no constituyen salario conforme al artículo 15 de la Ley 50 de 1990.\n");
});

// TERCERO
Clausula(
    "TERCERO. DURACIÓN DEL CONTRATO:",
    "El TRABAJADOR ha sido contratado para prestar sus servicios en la ejecución de una obra o labor determinada. El presente contrato finalizará automáticamente al concluir dicha obra o labor, sin necesidad de preaviso, lo cual constituye justa causa de terminación."
);

// CUARTO
Clausula(
    "CUARTO. PERÍODO DE PRUEBA:",
    "Las partes acuerdan un período de prueba no excedente a dos (2) meses, durante el cual cualquiera de las partes podrá dar por terminado el contrato sin previo aviso ni indemnización, conforme al artículo 80 del C.S.T."
);

// QUINTO
Clausula(
    "QUINTO. EXCLUSIVIDAD:",
    "El TRABAJADOR se obliga a no prestar servicios a otros empleadores ni a trabajar por cuenta propia en el mismo oficio durante la vigencia del contrato. El incumplimiento constituye justa causa de terminación."
);

// SEXTO
Clausula(
    "SEXTO. LUGAR DE TRABAJO:",
    "El trabajador prestará sus servicios en los municipios del Área Metropolitana del Valle de Aburrá o en el lugar que designe el EMPLEADOR según las necesidades del servicio."
);

column.Item().Text(t =>
{
    t.Span("Parágrafo primero: ").Bold();
    t.Span("El EMPLEADOR podrá ejercer el Ius Variandi conforme a la ley, cubriendo los gastos de traslado cuando aplique.\n\n");

    t.Span("Parágrafo segundo: ").Bold();
    t.Span("El trabajador acepta los cambios de lugar y funciones derivados de nuevas tecnologías o procesos.\n\n");

    t.Span("Parágrafo tercero: ").Bold();
    t.Span("El trabajador reconoce que deberá desplazarse a distintos lugares para cumplir sus funciones.");
});
//SEPTIMA
Clausula(
    "SEPTIMO. DEDUCCIONES O RETENCIONES: ",
    "Es obligación del EMPELADOR afiliar al TRABAJADOR a la seguridad social, como es salud, pensión y laborales; por lo tanto, el TRABAJADOR autoriza el descuento de los valores que le corresponda aportar, en la proporción establecida por la ley. Cuando por causa emanada directa o indirectamente de la relación contractual existan obligaciones de tipo económico a cargo del TRABAJADOR y a favor del EMPLEADOR; éste procederá a efectuar las deducciones a que hubiere lugar en cualquier tiempo y, más concretamente, a la terminación del presente Contrato de Trabajo de manera preferente, así lo autoriza desde ahora el trabajador, entendiendo expresamente las partes que la presente autorización cumple las condiciones, de orden escrita previa, aplicable para cada caso, de conformidad con el art. 149 del Código Sustantivo del Trabajo."
);
//OCTAVA
Clausula(
    "OCTAVO. JORNADA DE TRABAJO",
    "El trabajador se obliga a laborar la jornada máxima legal de cuarenta y cuatro (44) horas semanales, dentro de los horarios establecidos en el Reglamento Interno de Trabajo si lo hubiere o en el que entre a regir en un futuro; salvo estipulación expresa y escrita en contrario, en los turnos y dentro de las horas señaladas por el empleador, pudiendo hacer éste ajustes o cambios de horario cuando lo estime conveniente, ajustes y cambios que se entienden aceptados desde ya por el trabajador con la firma del presente contrato. Así mismo el empleador y el trabajador podrán acordar que la jornada semanal de cuarenta y cuatro (44) horas se realice mediante jornadas diarias flexibles de trabajo, distribuidas en máximo seis (6) días a la semana con un (1) día de descanso obligatorio, que podrá coincidir con el domingo. En éste, el número de horas de trabajo diario podrá repartirse de manera variable durante la respectiva semana y podrá ser de mínimo cuatro (4) horas continuas y hasta diez (10) horas diarias sin lugar a ningún recargo por trabajo suplementario, cuando el número de horas de trabajo no exceda el promedio de cuarenta y cuatro (44) horas semanales dentro de la jornada ordinaria diurna. De acuerdo con lo estipulado en las normas laborales"
);
column.Item().Text(t =>
{
    t.Span("Parágrafo: ").Bold();
    t.Span("Cuando el TRABAJADOR haya sido contratado para ejercer funciones de dirección, confianza o manejo no estará sujeto a los límites impuestos por la jornada máxima legal conforme el literal A del numeral 1 del artículo 162 del Código Sustantivo de Trabajo.");
});

//NOVENO
Clausula(
    "NOVENO.   HORAS EXTRAS, TRABAJO NOCTURNO, DOMINICAL Y FESTIVO: ",
    "Todo lo que reciba el trabajador como salario, fijo o variable, y que sobrepase el salario acordado entre empleador y trabajador, está destinado a cubrir el trabajo de horas extras o trabajo suplementario, el trabajo en días de domingo y festivos y el trabajo nocturno. EL TRABAJADOR se obliga a laborar la jornada mixta en los turnos y dentro de las horas señalados por EL EMPLEADOR, pudiendo hacer éste ajustes o cambios de horario cuando lo estime conveniente. Por el acuerdo expreso o tácito de las partes, podrán repartirse las horas de la jornada ordinaria en la forma prevista en el artículo 164 del Código Sustantivo del Trabajo, modificado por el artículo 23 de la Ley 50 de 1990, teniendo en cuenta que los tiempos de descanso entre las secciones de la jornada no se computan dentro de la misma, según el artículo 167 ibidem."
);
column.Item().Text(t =>
{
    t.Span("Parágrafo primero: ").Bold();
    t.Span("Todo trabajo suplementario o en horas extras y todo trabajo en día domingo o festivo en los que legalmente debe concederse descanso, mientras no sea labor que según la ley o contrato ha de ejecutarse así, debe autorizarlo u ordenarlo el EMPLEADOR o sus representantes previamente, para cada caso y por escrito. Cuando la necesidad de este trabajo se presente de manera imprevista o inaplazable, deberá ejecutarse y darse cuenta de él por escrito, a la mayor brevedad, al EMPLEADOR o a sus representantes EL EMPLEADOR, en consecuencia, no reconocerá ningún trabajo suplementario o en días de descanso legalmente obligatorio que no haya sido autorizado previamente o avisado inmediatamente, como queda dicho.\n\n");
    t.Span("Parágrafo segundo: ").Bold();
    t.Span("Cuando el TRABAJADOR haya sido contratado para ejercer funciones de dirección, confianza o manejo no tendrá derecho al pago de horas extras o trabajo suplementario conforme el parágrafo del artículo 161. El TRABAJADOR tendrá derecho al pago por recargo nocturno y dominical o festivo, así como también al reconocimiento de vacaciones disfrutadas o remuneradas, y prestaciones sociales en la misma manera que los demás trabajadores.");
});

//DECIMO
Clausula(
    "DECIMO. OBLIGACIONES, REGLAMENTO INTERNO DE TRABAJO, MANUAL DE FUNCIONES, SISTEMA DE GESTION DE SEGURIDAD Y SALUD EN EL TRABAJO, POLITICAS Y DIRECTRICES: ",
    "El TRABAJADOR se obliga a poner al servicio del EMPLEADOR toda su capacidad normal de trabajo, para desempeñarse en forma eficiente, necesaria y en forma exclusiva, bajo la continuada subordinación o dependencia del EMPLEADOR, en el desempeño de las funciones propias del cargo contratado, así como de cumplir con las obligaciones especificadas en el Reglamento Interno de Trabajo, Manual de Perfiles y Funciones, el Sistema de Gestión y Seguridad en el Trabajo, Código Sustantivo de Trabajo, Políticas, Directrices y órdenes e instrucciones que le imparta el EMPLEADOR o sus representantes."
);
//UNDÉCIMO
Clausula(
    "UNDÉCIMO. ELEMENTOS DE TRABAJO. ",
    "Corresponde al EMPLEADOR suministrar los elementos necesarios para el normal desempeño de las funciones del cargo contratado. Los recursos informáticos tanto de hardware como de software, incluido el acceso a internet, los ficheros y repositorios, así como el correo electrónico son calificados como una herramienta de trabajo que le pertenecen al EMPLEADOR, que utiliza el nombre de dominio de la compañía y que es otorgada por él a sus trabajadores o dependientes, en los términos establecidos por la legislación laboral colombiana (art. 60, núm. 8º, CST). Por ende, el correo electrónico institucional u oficial asignado a un trabajador solo debe ser utilizado para los fines relacionados con su objeto contractual o funciones, dado el caso de que el trabajador utilice dichos correos para asuntos personales y externos a lo laboral, éste deberá responder por lo consignado allí. Se informa y deja constancia expresa que para el trabajador no se genera ningún tipo de expectativa de privacidad cuando se utilizan correos electrónicos institucionales u oficiales, pues se otorgan como herramientas de trabajo. En consecuencia, el email no se equipará a la correspondencia epistolar o tradicional y no existe una expectativa de privacidad o secreto de las comunicaciones vía email."
);
//DUODECIMO
Clausula(
    "DUODÉCIMO. PROHIBICIÓN ESPECIAL: ",
    "Se prohíbe al trabajador recibir dineros, regalos, comisiones, propinas, favores o cualquier otra forma de dádiva a título personal de parte de clientes, proveedores, agentes del estado, jefes o compañeros de trabajo o cualquier otra persona interna o externa que tenga intereses económicos con el EMPLEADOR. En caso de presentarse el ofrecimiento es obligación del trabajador reportarlo a los directivos o representantes del empleador. El incumplimiento de esta cláusula será motivo para la terminación del contrato laboral con justa causa por parte del EMPLEADOR."
);
//DECIMOTERCERO
Clausula(
    "DECIMOTERCERO. CONFIDENCILIDAD: ",
    "CONFIDENCIALIDAD: las PARTES declaran reconocer las disposiciones legales pertinentes acerca de las eventuales responsabilidades a su cargo por dar a conocer o utilizar en cualquier forma información o datos. El TRABAJADOR se compromete a mantener en absoluta reserva, a no publicar ni divulgar a ningún tercero (incluida la familia de éste), ni a utilizar en beneficio propio o de un tercero o en detrimento del EMPLEADOR o un tercero, la Información clasificada como de carácter Confidencial por el EMPLEADOR que conozca en virtud de la presente relación contractual. Esta obligación permanecerá vigente y en efecto durante todo el término del presente contrato y durante cinco(5) años más. Constituye Información Confidencial, toda información de propiedad de el EMPLEADOR que no haya sido publicada, en relación con los negocios, finanzas, impuestos, asuntos legales, programas de computador, ventas, formulas, datos, procesos, métodos, artículos de fabricación, maquinaria, aparatos, diseños, materiales de composiciones, productos, ideas, mejoras, inventos, descubrimientos, trabajo experimental o de desarrollo, trabajo en proceso, planos, bienes intangibles, procedimientos en general, marcas o cualquier otro material que pertenezca o esté relacionado con la actividad técnica o comercial del EMPLEADOR; obtenida en reuniones, en correspondencia tanto oficial como no oficial, en conversaciones con la Gerencia y demás personal, mediante consultores externos, mediante miembros de organismos y autoridades gubernamentales, en virtud de informes oficiales del EMPLEADOR y borradores de tales reportes, por reclamos contra el EMPLEADOR o cualquiera de sus subsidiarias o sucursales, por información desarrollada o generada por EMPLEADOR o de cualquier otra forma. Al momento de la terminación del presente contrato, el TRABAJADOR no guardara copia alguna en archivos o medios magnéticos o electrónicos, ni conservará ni entregará a terceros, sino que devolverá al EMPLEADOR todos y cada uno de los planos, dibujos, especificaciones, elementos, notas, libros de notas, memorandos, reportes, estudios, correspondencia y demás documentos y en general todo el material que se relacione con los negocios del EMPLEADOR o de terceros sobre la cual el EMPLEADOR esté obligada a mantener confidencial, y que esté en su poder o bajo su custodia o control."
);
column.Item().Text(t =>
{
    t.Span("Parágrafo primero: ").Bold();
    t.Span("La violación de la cláusula de confidencialidad establecida en la presente cláusula, da lugar a la terminación del contrato laboral por justa causa al EMPLEADOR.");
});
//DECIMOCUARTO
Clausula(
    "DECIMOCUARTO. MANEJO Y PROTECCION DE DATOS PERSONALES: ",
    "Sin perjuicio de las demás disposiciones previstas en la ley, el TRABAJADOR que tenga acceso a las bases de datos que maneje el EMPLEADOR, o este inmerso en el proceso de recolección, conservación, tratamiento, supresión de datos, se compromete a: "
);
column.Item().Text(t =>
{
    t.Span("1)").Bold();
    t.Span("Garantizar al Titular, en todo tiempo, el pleno y efectivo ejercicio del derecho de hábeas data");
    t.Span("2)").Bold();
    t.Span("Velar por la conservación de la copia de la autorización otorgada por el titular");
    t.Span("3)").Bold();
    t.Span("Informarle al titular sobre la finalidad de la recolección y derechos que le asisten por virtud de la autorización otorgada");
    t.Span("4)").Bold();
    t.Span("darle cumplimiento a las medidas de seguridad de la información contenida en la ley y en las Políticas de Tratamiento de Datos y la ley, impidiendo la adulteración, perdida, consulta, uso o acceso no autorizado o fraudulento de la información");
    t.Span("5)").Bold();
    t.Span("Garantizar que la información que se suministre al Encargado del Tratamiento sea veraz, completa, exacta, actualizada, comprobable y comprensible");
    t.Span("6)").Bold();
    t.Span("Actualizar la información, comunicando de forma oportuna al Encargado del Tratamiento, todas las novedades respecto de los datos que previamente le haya suministrado y adoptar las demás medidas necesarias para que la información suministrada a este se mantenga actualizada");
    t.Span("7)").Bold();
    t.Span("Rectificar la información cuando sea incorrecta y comunicar lo pertinente al Encargado del Tratamiento");
    t.Span("8)").Bold();
    t.Span("Suministrar al Encargado del Tratamiento, según el caso, únicamente datos cuyo Tratamiento esté previamente autorizado de conformidad con lo previsto en la ley 1581 de 2012, decretos y normas complementarias");
    t.Span("9)").Bold();
    t.Span("Exigir al Encargado del Tratamiento en todo momento, el respeto a las condiciones de seguridad y privacidad de la información del Titular");
    t.Span("10)").Bold();
    t.Span("usar las bases de datos exclusivamente para las finalidades autorizadas por el titular");
    t.Span("11)").Bold();
    t.Span("garantizar y dar cumplimiento a los derechos y deberes de los responsables, encargados y titulares de las bases de datos");
    t.Span("12)").Bold();
    t.Span("cumplir con el debido proceso de incidentes de seguridad");
    t.Span("13)").Bold();
    t.Span("cuando el empleador lo solicite darle tramite a las consultas, quejas y reclamos presentados por los titulares de la información");
    t.Span("14)").Bold();
    t.Span("ajustarse estrictamente a la ley cuando se traten datos sensibles, de niños, niñas o adolescentes; darle cumplimiento a lo estipulado en la Política de Tratamiento de Datos Personales aprobada por el EMPLEADOR y en general a lo que ordene la Constitución y la Ley respecto el derecho de habeas data.\n\n");
    t.Span("Parágrafo").Bold();
    t.Span("Así mismo el trabajador que según la naturaleza del cargo para el cual fue contratado no podrá acceder a ninguna base de datos sin autorización del EMPLEADOR, una vez autorizado se acogerá a lo estipulado en esta cláusula.");
});

//DECIMOQUINTO
Clausula(
    "DECIMOQUINTO.   AUTORIZACIÓN DE TRATAMIENTO DE DATOS DEL TRABAJADOR:",
    "EL CONTRATISTA (o EL EMPLEADO), actuando en calidad de titular de los datos personales, autoriza expresamente a LA EMPRESA, en su calidad de responsable del tratamiento, a recolectar, almacenar, usar, circular, suprimir, transferir y transmitir sus datos personales, conforme a lo dispuesto en la Ley 1581 de 2012, el Decreto 1377 de 2013 y demás normas que regulan la protección de datos en Colombia. Los datos personales serán utilizados exclusivamente para las siguientes finalidades: \n\n -	Ejecutar las obligaciones derivadas del presente contrato.\n -	Cumplir con disposiciones legales en materia laboral, de seguridad social, tributaria, contable y de seguridad informática.\n-	Gestionar procesos internos administrativos, financieros y operativos.\n-	Comunicar información institucional o relacionada con el desarrollo de las actividades propias de LA EMPRESA.\n\nLA EMPRESA se compromete a implementar las medidas técnicas, humanas y administrativas necesarias para garantizar la seguridad de los datos personales, evitando su adulteración, pérdida, consulta, uso o acceso no autorizado o fraudulento. EL CONTRATISTA (o EL EMPLEADO) declara que conoce y acepta que tiene derecho a conocer, actualizar, rectificar y suprimir sus datos personales, así como a revocar la autorización otorgada, en los términos establecidos por la ley, mediante solicitud escrita dirigida a LA EMPRESA a través de los canales habilitados para tal fin. La presente autorización permanecerá vigente durante la relación contractual y por el término que sea necesario para cumplir con las finalidades descritas, o con lo que dispongan las normas aplicables."
);
//DECIMOSEXTO
Clausula(
    "DECIMOSEXTO. RÉGIMEN JURÍDICO APLICABLE. ",
    "En este contrato se entienden incorporadas todas las normas vigentes que regulan las relaciones entre el EMPLEADOR y el TRABAJADOR y las que lleguen a implementarse por la ley en el futuro."
);
//DECIMOSEPTIMO
Clausula(
    "DECIMOSÉPTIMO. DEROGATORIA DE OTROS CONTRATOS. ",
    "El presente contrato, deja sin efecto cualquier otro contrato verbal o escrito celebrado entre las partes contratantes, y lo reemplaza en su totalidad. Igualmente acuerdan las partes que cualquier modificación, adición o aclaración al presente contrato, deberá constar por escrito y ser suscrita por las partes, mediante OTROSI."
);
//DECIMOOCTAVO
Clausula(
    "DECIMOOCTAVO. DAÑOS. ",
    "Cuando EL EMPLEADO cometa daños a los elementos de trabajo, bienes y materias primas, por causas imputables a su culpa como negligencia, por el uso diferente para el que ordinariamente fue diseñado, por la falta de cuidado o desatención de las órdenes impartidas, adquiere el compromiso frente a EL EMPLEADOR de reparar dichos daños. En consecuencia, autoriza desde ahora a EL EMPLEADOR para que se compense el valor de los daños generados por su culpa. Esta facultad no contempla el evento de la responsabilidad por daños generados por el uso normal y corriente de los elementos de trabajo y bienes en general, al igual que cuando se han producido por acción de terceros o por caso fortuito o fuerza mayor."
);
Clausula(
    "DECIMONOVENO. DESCUENTOS: ",
    "Cuando por causa emanada directa o indirectamente de la relación contractual existan obligaciones de tipo económico a cargo de EL EMPLEADO y en favor de EL EMPLEADOR, éste procederá a efectuar las deducciones a que hubiere lugar en cual quier tiempo y, más concretamente, a la terminación del presente contrato, así lo autoriza desde ahora EL EMPLEADO, entendiendo expresamente LAS PARTES que la presente autorización cumple las condiciones, de orden escrita previa, aplicable para cada caso. En general, EL EMPLEADO autoriza a EL EMPLEADOR a que éste último compense del valor de los salarios, prestaciones legales o extralegales, indemnizaciones, bonificaciones y otro tipo de dinero a pagar en el momento de la liquidación, de las siguientes sumas de dinero:"
);
column.Item().Text(t =>
{
    t.Span("a)").Bold();
    t.Span("Lo relativo a la cláusula anterior.\n");
    t.Span("b)").Bold();
    t.Span("Préstamos y/o saldos debidamente autorizados por escrito.\n");
    t.Span("c)").Bold();
    t.Span("Valor de los elementos de trabajo, equipos y mercancías extraviadas bajo su responsabilidad y que llegaren a faltar al momento de hacer entrega del inventario.\n");
    t.Span("d)").Bold();
    t.Span("Los valores que se hubieran confiado para su manejo, y que hayan sido dispuestos abusivamente para otros propósitos en perjuicio de EL EMPLEADOR.\n");
    t.Span("e)").Bold();
    t.Span("Los anticipos o sumas no legalizadas con las facturas o comprobantes requeridos que les fueron entregadas para gastos, viajes o compras menores.\n\n");
    t.Span("Parágrafo primero: ").Bold();
    t.Span("Este descuento se podrá realizar de la nómina quincenal o mensual o de las prestaciones sociales, indemnizaciones, descansos o cualquier beneficio que resulte con ocasión de la existencia o terminación del contrato por cualquier motivo.\n");
    t.Span("Parágrafo segundo: ").Bold();
    t.Span("El Trabajador autoriza expresamente al Empleador cualquier deducción, descuento o retención de su salario, prestaciones sociales o liquidaciones laborales, cuando esté implicada su responsabilidad en la pérdida de dinero, materiales, materia prima, herramientas, útiles de trabajo, o cualquier otro ítem, siempre que no afecte el salario mímico vital o la parte inembargable de su salario.");
});
//VIGESIMA CLAUSULA
Clausula(
    "VIGÉSIMO.",
    "El TRABAJADOR reconoce que todas las obras, desarrollos, creaciones, entregables, invenciones, software, planos, datos, escritos, informes, bases de datos, metodologías, diseños, marcas, modelos de utilidad, obras audiovisuales, documentos técnicos, know-how, y en general cualquier resultado susceptible de protección por el régimen de propiedad intelectual o derechos de autor que se genere durante la ejecución del presente contrato laboral y en cumplimiento de sus funciones, serán de titularidad exclusiva del EMPLEADOR, sin limitación territorial o temporal, por lo cual cede de manera expresa y gratuita todos los derechos patrimoniales de autor que pudieran corresponderle sobre tales creaciones.\nEsta cesión incluye, a título enunciativo, pero no limitativo, los derechos de: \n•	Reproducción, por cualquier medio o formato, conocido o por conocerse.\n•	Comunicación pública, por cualquier medio físico o digital.\n•	Distribución, comercialización o puesta a disposición del público.\n•	Transformación,	incluyendo	traducción, adaptación, arreglo,	compilación, digitalización, modificación del formato o soporte.\n•	Importación, exportación o explotación comercial, en cualquier mercado, nacional o internacional. El TRABAJADOR se compromete, de ser requerido, a suscribir cualquier documento adicional que sea necesario para garantizar la plena titularidad de los derechos por parte del EMPLEADOR, así como a realizar los trámites que correspondan ante las autoridades competentes."
);
column.Item().Text(t =>
{
    t.Span("Parágrafo:").Bold();
    t.Span("Toda publicación, divulgación o uso por parte del TRABAJADOR de los productos intelectuales derivados de la relación laboral requerirá autorización previa y escrita del EMPLEADOR.");
});

        // ================= FIRMAS =================
        column.Item().PaddingTop(30).Row(row =>
        {
            row.RelativeItem().AlignCenter().Column(col =>
            {
                col.Item().Text("______________________________");
                col.Item().Text("Firma del Empleado").Bold();
                col.Item().Text(e.NombreCompleto).FontSize(10);
                col.Item().Text($"C.C. {e.Cedula}").FontSize(10);
            });

            row.RelativeItem().AlignCenter().Column(col =>
            {
                col.Item().Text("______________________________");
                col.Item().Text("Firma del Empleador").Bold();
                col.Item().Text("ERNÉSTO CASTRILLÓN FERNÁNDEZ").FontSize(10);
                col.Item().Text("C.C. 1.037.613.064").FontSize(10);
                col.Item().Text("PICSO S.A.S").FontSize(10);
            });
        });
    });
}


        private void Fila(TableDescriptor table, string label, string valor)
        {
            table.Cell().Text(label).Bold().FontSize(10);
            table.Cell().Text(valor).FontSize(10);
        }

        private string Bold(string text) => text;

        private string NumeroALetras(decimal numero)
{
    long entero = (long)numero;
    return $"{Convertir(entero)} PESOS ";
}

private string Convertir(long numero)
{
    if (numero == 0) return "CERO";
    if (numero < 0) return "MENOS " + Convertir(Math.Abs(numero));

    string resultado = "";

    if (numero >= 1000000)
    {
        resultado += (numero / 1000000 == 1 ? "UN MILLÓN " : Convertir(numero / 1000000) + " MILLONES ");
        numero %= 1000000;
    }

    if (numero >= 1000)
    {
        resultado += (numero / 1000 == 1 ? "MIL " : Convertir(numero / 1000) + " MIL ");
        numero %= 1000;
    }

    if (numero >= 100)
    {
        if (numero == 100)
            resultado += "CIEN ";
        else
        {
            string[] centenas = {
                "", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS",
                "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"
            };
            resultado += centenas[numero / 100] + " ";
            numero %= 100;
        }
    }

    if (numero >= 20)
    {
        string[] decenas = {
            "", "", "VEINTE", "TREINTA", "CUARENTA",
            "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"
        };
        resultado += decenas[numero / 10];
        if (numero % 10 > 0)
            resultado += " Y " + Convertir(numero % 10);
        resultado += " ";
        return resultado.Trim();
    }

    if (numero >= 10)
    {
        string[] especiales = {
            "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE",
            "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"
        };
        resultado += especiales[numero - 10] + " ";
        return resultado.Trim();
    }

    if (numero > 0)
    {
        string[] unidades = {
            "", "UNO", "DOS", "TRES", "CUATRO",
            "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"
        };
        resultado += unidades[numero] + " ";
    }

    return resultado.Trim();
}

private void MarcaDeAgua(IContainer container)
{
    container
        .AlignCenter()
        .AlignMiddle()
        .Rotate(-30)
        .Text("CONFIDENCIAL PICSO")
            .FontSize(60)
            .Bold()
            .FontColor(Colors.Grey.Lighten3);
}


    }
    
}

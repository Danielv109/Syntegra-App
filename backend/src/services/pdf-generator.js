import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateReport(reportData, client) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`🔧 Iniciando generación de PDF para ${client.name}`);

      // Crear directorio de reportes si no existe
      const reportsDir = path.join(__dirname, "../../reports");

      if (!fs.existsSync(reportsDir)) {
        console.log(`📁 Creando directorio: ${reportsDir}`);
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const filename = `report_${client.id}_${Date.now()}.pdf`;
      const filepath = path.join(reportsDir, filename);

      console.log(`📝 Archivo: ${filename}`);
      console.log(`📂 Ruta completa: ${filepath}`);

      // Crear documento PDF
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true,
      });

      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      console.log(`✍️ Escribiendo contenido del PDF...`);

      // === HEADER ===
      doc
        .fontSize(28)
        .fillColor("#0d0d0d")
        .font("Helvetica-Bold")
        .text("Syntegra", 50, 50);

      doc
        .fontSize(10)
        .fillColor("#71717a")
        .font("Helvetica")
        .text("Reporte de Análisis de Cliente", 50, 85);

      // Línea separadora
      doc.moveTo(50, 110).lineTo(545, 110).strokeColor("#e5e7eb").stroke();

      // === INFO DEL CLIENTE ===
      let yPosition = 130;

      doc
        .fontSize(20)
        .fillColor("#0d0d0d")
        .font("Helvetica-Bold")
        .text(client.name, 50, yPosition);

      yPosition += 30;

      doc
        .fontSize(10)
        .fillColor("#71717a")
        .font("Helvetica")
        .text(
          `Industria: ${client.industry || "No especificada"}`,
          50,
          yPosition
        )
        .text(
          `Fecha de generación: ${new Date().toLocaleDateString("es-ES")}`,
          350,
          yPosition
        );

      yPosition += 40;

      // === KPIs ===
      doc
        .fontSize(16)
        .fillColor("#0d0d0d")
        .font("Helvetica-Bold")
        .text("Métricas Clave", 50, yPosition);

      yPosition += 25;

      const kpiData = reportData.kpis || [];
      const kpiWidth = 120;
      const kpiHeight = 70;
      const kpiGap = 15;

      kpiData.forEach((kpi, index) => {
        const col = index % 4;
        const xPos = 50 + col * (kpiWidth + kpiGap);
        const yPos = yPosition;

        // Caja del KPI
        doc
          .rect(xPos, yPos, kpiWidth, kpiHeight)
          .fillAndStroke("#f9fafb", "#e5e7eb");

        // Label
        doc
          .fontSize(8)
          .fillColor("#71717a")
          .font("Helvetica")
          .text(kpi.label.toUpperCase(), xPos + 10, yPos + 10, {
            width: kpiWidth - 20,
            align: "left",
          });

        // Value
        doc
          .fontSize(20)
          .fillColor("#0d0d0d")
          .font("Helvetica-Bold")
          .text(kpi.value, xPos + 10, yPos + 28, {
            width: kpiWidth - 20,
            align: "left",
          });

        // Delta
        if (kpi.delta) {
          const deltaColor =
            kpi.trend === "up"
              ? "#10b981"
              : kpi.trend === "down"
              ? "#ef4444"
              : "#71717a";
          doc
            .fontSize(8)
            .fillColor(deltaColor)
            .font("Helvetica")
            .text(kpi.delta, xPos + 10, yPos + 52, {
              width: kpiWidth - 20,
              align: "left",
            });
        }
      });

      yPosition += kpiHeight + 40;

      // === SENTIMIENTO POR CANAL ===
      if (
        reportData.sentimentByChannel &&
        reportData.sentimentByChannel.length > 0
      ) {
        doc
          .fontSize(16)
          .fillColor("#0d0d0d")
          .font("Helvetica-Bold")
          .text("Sentimiento por Canal", 50, yPosition);

        yPosition += 25;

        reportData.sentimentByChannel.forEach((channel) => {
          const total = channel.positive + channel.neutral + channel.negative;

          if (total === 0) return; // Skip si no hay datos

          const positivePercent = Math.round((channel.positive / total) * 100);
          const neutralPercent = Math.round((channel.neutral / total) * 100);
          const negativePercent = Math.round((channel.negative / total) * 100);

          // Nombre del canal
          doc
            .fontSize(11)
            .fillColor("#0d0d0d")
            .font("Helvetica-Bold")
            .text(channel.channel, 50, yPosition);

          yPosition += 18;

          // Barra de progreso
          const barWidth = 400;
          const barHeight = 20;

          // Fondo
          doc.rect(50, yPosition, barWidth, barHeight).fill("#f3f4f6");

          // Segmentos
          let xOffset = 50;

          // Positivo
          if (positivePercent > 0) {
            const posWidth = (barWidth * positivePercent) / 100;
            doc.rect(xOffset, yPosition, posWidth, barHeight).fill("#10b981");
            xOffset += posWidth;
          }

          // Neutral
          if (neutralPercent > 0) {
            const neuWidth = (barWidth * neutralPercent) / 100;
            doc.rect(xOffset, yPosition, neuWidth, barHeight).fill("#a78bfa");
            xOffset += neuWidth;
          }

          // Negativo
          if (negativePercent > 0) {
            const negWidth = (barWidth * negativePercent) / 100;
            doc.rect(xOffset, yPosition, negWidth, barHeight).fill("#ef4444");
          }

          // Porcentajes
          doc
            .fontSize(9)
            .fillColor("#71717a")
            .font("Helvetica")
            .text(
              `${positivePercent}% positivo  •  ${neutralPercent}% neutral  •  ${negativePercent}% negativo`,
              460,
              yPosition + 5
            );

          yPosition += 35;
        });

        yPosition += 10;
      }

      // === NUEVA PÁGINA SI ES NECESARIO ===
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }

      // === TEMAS RECURRENTES ===
      if (reportData.topics && reportData.topics.length > 0) {
        doc
          .fontSize(16)
          .fillColor("#0d0d0d")
          .font("Helvetica-Bold")
          .text("Temas Recurrentes", 50, yPosition);

        yPosition += 25;

        reportData.topics.forEach((topic) => {
          const sentimentColor =
            topic.sentiment === "positive"
              ? "#10b981"
              : topic.sentiment === "negative"
              ? "#ef4444"
              : "#a78bfa";

          // Círculo de sentimiento
          doc.circle(60, yPosition + 7, 4).fill(sentimentColor);

          // Tema
          doc
            .fontSize(11)
            .fillColor("#0d0d0d")
            .font("Helvetica")
            .text(topic.topic, 75, yPosition, { width: 350 });

          // Conteo
          doc
            .fontSize(10)
            .fillColor("#71717a")
            .font("Helvetica")
            .text(`${topic.count} menciones`, 450, yPosition);

          yPosition += 25;
        });

        yPosition += 20;
      }

      // === ALERTAS ===
      if (reportData.alerts && reportData.alerts.length > 0) {
        if (yPosition > 600) {
          doc.addPage();
          yPosition = 50;
        }

        doc
          .fontSize(16)
          .fillColor("#0d0d0d")
          .font("Helvetica-Bold")
          .text("Alertas Críticas", 50, yPosition);

        yPosition += 25;

        reportData.alerts.forEach((alert) => {
          const alertColor =
            alert.severity === "high"
              ? "#ef4444"
              : alert.severity === "medium"
              ? "#f59e0b"
              : "#60a5fa";

          // Barra lateral de color
          doc.rect(50, yPosition, 4, 40).fill(alertColor);

          // Mensaje
          doc
            .fontSize(10)
            .fillColor("#0d0d0d")
            .font("Helvetica")
            .text(alert.message, 65, yPosition + 5, {
              width: 480,
              lineGap: 2,
            });

          yPosition += 50;

          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }
        });
      }

      // === FOOTER ===
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);

        doc
          .fontSize(8)
          .fillColor("#94a3b8")
          .font("Helvetica")
          .text(`Página ${i + 1} de ${pageCount}`, 50, doc.page.height - 50, {
            align: "center",
            width: doc.page.width - 100,
          });

        doc
          .fontSize(8)
          .fillColor("#94a3b8")
          .text(
            "Generado por Syntegra • Análisis de Cliente con IA",
            50,
            doc.page.height - 35,
            { align: "center", width: doc.page.width - 100 }
          );
      }

      console.log(`📄 Finalizando documento PDF...`);

      // Finalizar documento
      doc.end();

      stream.on("finish", () => {
        console.log(`✅ PDF escrito exitosamente en disco`);
        console.log(
          `📊 Tamaño del archivo: ${fs.statSync(filepath).size} bytes`
        );
        resolve({ filename, filepath });
      });

      stream.on("error", (error) => {
        console.error(`❌ Error al escribir PDF:`, error);
        reject(error);
      });
    } catch (error) {
      console.error(`❌ Error en generateReport:`, error);
      reject(error);
    }
  });
}

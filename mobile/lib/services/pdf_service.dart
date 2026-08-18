import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../models/models.dart';

class PdfService {
  static Future<void> generateAndPrintReferralSlip(Report report) async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (pw.Context context) {
          final isHighRisk = report.riskTier == RiskTier.red;
          final riskColor = isHighRisk
              ? PdfColors.red700
              : (report.riskTier == RiskTier.amber
                  ? PdfColors.amber800
                  : PdfColors.green700);

          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // Header
              pw.Container(
                padding: const pw.EdgeInsets.all(16),
                decoration: pw.BoxDecoration(
                  color: PdfColors.blueGrey900,
                  borderRadius: pw.BorderRadius.circular(8),
                ),
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text(
                          'NATIONAL IDSP CLINICAL REFERRAL SLIP',
                          style: pw.TextStyle(
                            color: PdfColors.white,
                            fontSize: 14,
                            fontWeight: pw.FontWeight.bold,
                          ),
                        ),
                        pw.SizedBox(height: 4),
                        pw.Text(
                          'Arogya Prahari Outbreak Surveillance Platform',
                          style: const pw.TextStyle(
                            color: PdfColors.grey300,
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ),
                    pw.BarcodeWidget(
                      data: 'AP-${report.id.substring(0, 8).toUpperCase()}',
                      barcode: pw.Barcode.qrCode(),
                      width: 48,
                      height: 48,
                      color: PdfColors.white,
                    ),
                  ],
                ),
              ),

              pw.SizedBox(height: 20),

              // Risk Alert Banner
              pw.Container(
                width: double.infinity,
                padding: const pw.EdgeInsets.symmetric(vertical: 10, horizontal: 16),
                decoration: pw.BoxDecoration(
                  color: riskColor,
                  borderRadius: pw.BorderRadius.circular(6),
                ),
                child: pw.Text(
                  'TRIAGE CLASSIFICATION: ${report.riskTier.name.toUpperCase()} RISK TIER',
                  style: pw.TextStyle(
                    color: PdfColors.white,
                    fontSize: 13,
                    fontWeight: pw.FontWeight.bold,
                  ),
                ),
              ),

              pw.SizedBox(height: 20),

              // Patient Demographics
              pw.Text('1. Patient Demographics & Location',
                  style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 12)),
              pw.Divider(thickness: 1, color: PdfColors.grey400),
              pw.SizedBox(height: 6),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('Full Name: ${report.patientName}', style: const pw.TextStyle(fontSize: 11)),
                  pw.Text('Age: ${report.age} yrs', style: const pw.TextStyle(fontSize: 11)),
                  pw.Text('Gender: ${report.sex}', style: const pw.TextStyle(fontSize: 11)),
                ],
              ),
              pw.SizedBox(height: 6),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('Village/Wasti: ${report.village}', style: const pw.TextStyle(fontSize: 11)),
                  pw.Text('Contact: ${report.contactNumber ?? "N/A"}', style: const pw.TextStyle(fontSize: 11)),
                  pw.Text('Date: ${report.createdAt.toLocal().toString().split(".")[0]}', style: const pw.TextStyle(fontSize: 11)),
                ],
              ),

              pw.SizedBox(height: 20),

              // Clinical Presentation
              pw.Text('2. Clinical Presentation & Symptoms',
                  style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 12)),
              pw.Divider(thickness: 1, color: PdfColors.grey400),
              pw.SizedBox(height: 6),
              pw.Text('Reported Symptoms:', style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold)),
              pw.SizedBox(height: 4),
              pw.Wrap(
                spacing: 6,
                runSpacing: 6,
                children: report.symptoms.map((s) => pw.Container(
                  padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: pw.BoxDecoration(
                    color: PdfColors.grey200,
                    borderRadius: pw.BorderRadius.circular(4),
                  ),
                  child: pw.Text(s, style: const pw.TextStyle(fontSize: 10)),
                )).toList(),
              ),

              pw.SizedBox(height: 10),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('Duration: ${report.durationDays} days', style: const pw.TextStyle(fontSize: 11)),
                  pw.Text('Body Temp: ${report.temperature ?? "N/A"} ${report.temperatureUnit ?? "°F"}', style: const pw.TextStyle(fontSize: 11)),
                ],
              ),

              pw.SizedBox(height: 20),

              // Action Directives
              pw.Text('3. Clinical Directives & Referral Action',
                  style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 12)),
              pw.Divider(thickness: 1, color: PdfColors.grey400),
              pw.SizedBox(height: 6),
              pw.Container(
                padding: const pw.EdgeInsets.all(12),
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.grey300),
                  borderRadius: pw.BorderRadius.circular(6),
                ),
                child: pw.Text(
                  isHighRisk
                      ? 'IMMEDIATE EMERGENCY REFERRAL REQUIRED: Transport patient immediately to nearest Primary Health Centre (PHC) or Sub-District Hospital. Administer oral rehydration (ORS) during transit. Alert District Medical Officer.'
                      : 'STANDARD PHC CARE: Monitor hydration, vitals and schedule 24-hour follow-up. Provide ORS packets and symptomatic treatment.',
                  style: const pw.TextStyle(fontSize: 10, lineSpacing: 2),
                ),
              ),

              pw.Spacer(),

              // Signatures
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text('_____________________________', style: const pw.TextStyle(fontSize: 10)),
                      pw.Text('ASHA / Frontline Worker Sign', style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey600)),
                    ],
                  ),
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text('_____________________________', style: const pw.TextStyle(fontSize: 10)),
                      pw.Text('Receiving Medical Officer Sign', style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey600)),
                    ],
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
      name: 'Referral_Slip_${report.patientName.replaceAll(" ", "_")}.pdf',
    );
  }
}

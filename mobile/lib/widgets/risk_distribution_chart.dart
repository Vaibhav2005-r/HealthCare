import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../models/models.dart';
import '../theme/app_colors.dart';

class RiskDistributionChart extends StatelessWidget {
  final List<Report> reports;

  const RiskDistributionChart({super.key, required this.reports});

  @override
  Widget build(BuildContext context) {
    int green = 0;
    int amber = 0;
    int red = 0;

    for (var report in reports) {
      if (report.riskTier == RiskTier.green) green++;
      else if (report.riskTier == RiskTier.amber) amber++;
      else if (report.riskTier == RiskTier.red) red++;
    }
    
    final total = green + amber + red;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Risk Distribution',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
            ),
            const SizedBox(height: 24),
            total == 0 
              ? const SizedBox(
                  height: 150, 
                  child: Center(
                    child: Text('No data available', style: TextStyle(color: AppColors.textSecondary))
                  )
                )
              : SizedBox(
                  height: 150,
                  child: Row(
                    children: [
                      Expanded(
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            PieChart(
                              PieChartData(
                                sectionsSpace: 2,
                                centerSpaceRadius: 40,
                                sections: [
                                  if (green > 0)
                                    PieChartSectionData(
                                      color: AppColors.riskGreen,
                                      value: green.toDouble(),
                                      title: '',
                                      radius: 20,
                                    ),
                                  if (amber > 0)
                                    PieChartSectionData(
                                      color: AppColors.riskAmber,
                                      value: amber.toDouble(),
                                      title: '',
                                      radius: 20,
                                    ),
                                  if (red > 0)
                                    PieChartSectionData(
                                      color: AppColors.riskRed,
                                      value: red.toDouble(),
                                      title: '',
                                      radius: 20,
                                    ),
                                ],
                              ),
                            ),
                            Text(
                              '$total',
                              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 24),
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildLegend('Low Risk', green, AppColors.riskGreen),
                          const SizedBox(height: 12),
                          _buildLegend('Moderate', amber, AppColors.riskAmber),
                          const SizedBox(height: 12),
                          _buildLegend('High Risk', red, AppColors.riskRed),
                        ],
                      ),
                    ],
                  ),
                ),
          ],
        ),
      ),
    );
  }

  Widget _buildLegend(String label, int count, Color color) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          '$label ($count)',
          style: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

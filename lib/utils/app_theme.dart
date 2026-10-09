import 'package:flutter/material.dart';

class AppTheme {
  // Colores principales
  static const Color primaryColor = Color(0xFF1E3A5F);
  static const Color secondaryColor = Color(0xFF2E7D32);
  static const Color accentColor = Color(0xFFFF6F00);
  static const Color backgroundColor = Color(0xFF0D1117);
  static const Color surfaceColor = Color(0xFF161B22);
  static const Color cardColor = Color(0xFF21262D);

  // Colores de avance
  static const Color colorNoIniciado = Color(0xFF9E9E9E); // Gris
  static const Color colorRetrasado = Color(0xFFE53935); // Rojo
  static const Color colorEnEjecucion = Color(0xFFFF9800); // Naranja
  static const Color colorAvanzado = Color(0xFFFDD835); // Amarillo
  static const Color colorCasiTerminado = Color(0xFF1E88E5); // Azul
  static const Color colorTerminado = Color(0xFF43A047); // Verde

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: const ColorScheme.dark(
        primary: primaryColor,
        secondary: secondaryColor,
        surface: surfaceColor,
        error: colorRetrasado,
      ),
      scaffoldBackgroundColor: backgroundColor,
      cardTheme: const CardTheme(
        color: cardColor,
        elevation: 4,
        margin: EdgeInsets.all(8),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: primaryColor,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarTheme(
        backgroundColor: surfaceColor,
        selectedItemColor: accentColor,
        unselectedItemColor: Colors.grey,
      ),
      floatingActionButtonTheme: const FloatingActionButtonTheme(
        backgroundColor: accentColor,
        foregroundColor: Colors.white,
      ),
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
        headlineMedium: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
        titleLarge: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
        bodyLarge: TextStyle(
          fontSize: 16,
          color: Colors.white,
        ),
        bodyMedium: TextStyle(
          fontSize: 14,
          color: Colors.white70,
        ),
      ),
    );
  }

  static Color getColorByProgress(double progress) {
    if (progress <= 0) return colorNoIniciado;
    if (progress < 25) return colorRetrasado;
    if (progress < 50) return colorEnEjecucion;
    if (progress < 75) return colorAvanzado;
    if (progress < 100) return colorCasiTerminado;
    return colorTerminado;
  }

  static String getProgressLabel(double progress) {
    if (progress <= 0) return 'No iniciado';
    if (progress < 25) return 'Retrasado';
    if (progress < 50) return 'En ejecución';
    if (progress < 75) return 'Avanzado';
    if (progress < 100) return 'Casi terminado';
    return 'Terminado';
  }
}

import 'package:flutter/material.dart';
import '../services/ai_service.dart';
import '../utils/app_theme.dart';

/// Pantalla del Asistente IA para consultas inteligentes
class AIAssistantScreen extends StatefulWidget {
  const AIAssistantScreen({super.key});

  @override
  State<AIAssistantScreen> createState() => _AIAssistantScreenState();
}

class _AIAssistantScreenState extends State<AIAssistantScreen> {
  final AIService _aiService = AIService();
  final TextEditingController _controller = TextEditingController();
  final List<Map<String, String>> _messages = [];
  bool _isTyping = false;

  @override
  void initState() {
    super.initState();
    _messages.add({
      'role': 'assistant',
      'content': '''¡Hola! Soy el asistente IA del Túnel 0. 

Puedo ayudarte con:
• Avance actual del túnel
• Módulos retrasados
• Concreto vaciado
• Rendimiento y productividad
• Proyección de terminación
• Estado de actividades

¿En qué puedo ayudarte?''',
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.smart_toy, color: Colors.white),
            SizedBox(width: 8),
            Text('Asistente IA'),
          ],
        ),
        backgroundColor: AppTheme.primaryColor,
      ),
      body: Column(
        children: [
          // Mensajes
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                final isUser = message['role'] == 'user';
                return _buildMessageBubble(isUser, message['content']!);
              },
            ),
          ),
          
          // Indicador de escritura
          if (_isTyping)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  _buildTypingIndicator(),
                  const SizedBox(width: 8),
                  Text(
                    'IA está escribiendo...',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.5),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          
          // Sugerencias rápidas
          Container(
            height: 50,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                _buildSuggestionChip('¿Avance total?'),
                _buildSuggestionChip('¿Módulos retrasados?'),
                _buildSuggestionChip('¿Concreto vaciado?'),
                _buildSuggestionChip('¿Proyección?'),
              ],
            ),
          ),
          
          // Campo de entrada
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.cardColor,
              border: Border(
                top: BorderSide(color: Colors.white.withOpacity(0.1)),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: InputDecoration(
                      hintText: 'Escribe tu consulta...',
                      hintStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                      filled: true,
                      fillColor: AppTheme.surfaceColor,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 12,
                      ),
                    ),
                    style: const TextStyle(color: Colors.white),
                    onSubmitted: _enviarMensaje,
                  ),
                ),
                const SizedBox(width: 12),
                FloatingActionButton.small(
                  onPressed: () => _enviarMensaje(_controller.text),
                  backgroundColor: AppTheme.accentColor,
                  child: const Icon(Icons.send, color: Colors.white),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(bool isUser, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            CircleAvatar(
              backgroundColor: AppTheme.accentColor,
              radius: 16,
              child: const Icon(Icons.smart_toy, size: 18, color: Colors.white),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isUser ? AppTheme.accentColor : AppTheme.cardColor,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isUser ? 16 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 16),
                ),
              ),
              child: Text(
                content,
                style: TextStyle(
                  color: isUser ? Colors.white : Colors.white.withOpacity(0.9),
                  fontSize: 14,
                ),
              ),
            ),
          ),
          if (isUser) ...[
            const SizedBox(width: 8),
            CircleAvatar(
              backgroundColor: AppTheme.secondaryColor,
              radius: 16,
              child: const Icon(Icons.person, size: 18, color: Colors.white),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (index) {
        return TweenAnimationBuilder<double>(
          tween: Tween(begin: 0, end: 1),
          duration: Duration(milliseconds: 600 + (index * 200)),
          builder: (context, value, child) {
            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 2),
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(value),
                shape: BoxShape.circle,
              ),
            );
          },
        );
      }),
    );
  }

  Widget _buildSuggestionChip(String text) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ActionChip(
        label: Text(
          text,
          style: const TextStyle(color: Colors.white, fontSize: 12),
        ),
        backgroundColor: AppTheme.cardColor,
        side: BorderSide(color: Colors.white.withOpacity(0.2)),
        onPressed: () => _enviarMensaje(text),
      ),
    );
  }

  void _enviarMensaje(String text) {
    if (text.trim().isEmpty) return;

    setState(() {
      _messages.add({'role': 'user', 'content': text.trim()});
      _isTyping = true;
    });

    _controller.clear();

    // Simular respuesta de IA
    Future.delayed(const Duration(milliseconds: 800), () {
      final respuesta = _aiService.procesarConsulta(text);
      
      setState(() {
        _messages.add({'role': 'assistant', 'content': respuesta});
        _isTyping = false;
      });
    });
  }
}

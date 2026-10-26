import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'usuarios.json');
const COMPARISONS_FILE = path.join(DATA_DIR, 'comparaciones.json');
const AUDIT_FILE = path.join(DATA_DIR, 'auditoria.json');

const COOKIE_SECRET = process.env.COOKIE_SECRET || 'banco-colombia-seguros-secret-key-2026';
const SESSION_COOKIE_NAME = 'banco_colombia_session';

interface UserRecord {
  id: string;
  usuario: string; // nombre corto, sin espacios, en minúsculas
  nombreCompleto: string;
  rol: 'administrador' | 'asesor';
  estado: 'activo' | 'suspendido';
  debeCambiarClave: boolean;
  fechaCreacion: string;
  ultimoAcceso: string | null;
  passwordHash: string;
}

// In-memory active sessions: token -> { userId, expiresAt }
const activeSessions = new Map<string, { userId: string; expiresAt: number }>();

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Initialize data/usuarios.json if it doesn't exist
  if (!fs.existsSync(USERS_FILE)) {
    const salt = bcrypt.genSaltSync(10);
    const initialHash = bcrypt.hashSync('Fundepos2026*', salt);
    const initialUsers: UserRecord[] = [
      {
        id: 'user-admin-1',
        usuario: 'admin',
        nombreCompleto: 'Administrador',
        rol: 'administrador',
        estado: 'activo',
        debeCambiarClave: true,
        fechaCreacion: new Date().toISOString(),
        ultimoAcceso: null,
        passwordHash: initialHash,
      },
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2), 'utf-8');
    console.log('[Auth] data/usuarios.json inicializado con el usuario "admin"');
  }

  // Initialize data/comparaciones.json
  if (!fs.existsSync(COMPARISONS_FILE)) {
    fs.writeFileSync(COMPARISONS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }

  // Initialize data/auditoria.json
  if (!fs.existsSync(AUDIT_FILE)) {
    fs.writeFileSync(AUDIT_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function readUsers(): UserRecord[] {
  try {
    ensureDataFiles();
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error leyendo usuarios.json:', err);
    return [];
  }
}

function saveUsers(users: UserRecord[]) {
  try {
    ensureDataFiles();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error guardando usuarios.json:', err);
  }
}

function appendAudit(usuarioId: string, usuario: string, accion: string, detalles?: any) {
  try {
    ensureDataFiles();
    let records: any[] = [];
    if (fs.existsSync(AUDIT_FILE)) {
      records = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf-8'));
    }
    records.push({
      id: crypto.randomUUID(),
      usuarioId,
      usuario,
      accion,
      fecha: new Date().toISOString(),
      detalles: detalles || null,
    });
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error guardando auditoria:', err);
  }
}

function appendComparison(usuarioId: string, comparisonData: any) {
  try {
    ensureDataFiles();
    let records: any[] = [];
    if (fs.existsSync(COMPARISONS_FILE)) {
      records = JSON.parse(fs.readFileSync(COMPARISONS_FILE, 'utf-8'));
    }
    records.push({
      id: crypto.randomUUID(),
      usuarioId,
      fecha: new Date().toISOString(),
      ...comparisonData,
    });
    fs.writeFileSync(COMPARISONS_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error guardando comparacion:', err);
  }
}

function sanitizeUser(user: UserRecord) {
  const { passwordHash, ...rest } = user;
  return rest;
}

function getAuthenticatedUser(req: Request): UserRecord | null {
  const token = req.signedCookies[SESSION_COOKIE_NAME];
  if (!token) return null;

  const session = activeSessions.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }

  const users = readUsers();
  const user = users.find((u) => u.id === session.userId);
  return user || null;
}

// Authentication middleware enforcing rule 5
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Sesión no válida o expirada. Por favor inicie sesión.' });
  }
  if (user.estado !== 'activo') {
    return res.status(401).json({ error: 'usuario suspendido, contacte al administrador' });
  }
  (req as any).user = user;
  next();
}

async function startServer() {
  ensureDataFiles();

  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json({ limit: '50mb' }));
  app.use(cookieParser(COOKIE_SECRET));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================

  // POST /api/login (usuario y contraseña)
  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const rawUsuario = req.body.usuario || req.body.username || '';
      const rawContrasena = req.body.contrasena || req.body.password || '';

      const cleanUsuario = rawUsuario.trim().toLowerCase();

      if (!cleanUsuario || !rawContrasena) {
        return res.status(401).json({ error: 'usuario o contraseña incorrectos' });
      }

      const users = readUsers();
      const user = users.find((u) => u.usuario.toLowerCase() === cleanUsuario);

      if (!user) {
        return res.status(401).json({ error: 'usuario o contraseña incorrectos' });
      }

      const isMatch = await bcrypt.compare(rawContrasena, user.passwordHash);
      if (!isMatch) {
        appendAudit(user.id, user.usuario, 'LOGIN_FALLIDO', { motivo: 'Contraseña incorrecta' });
        return res.status(401).json({ error: 'usuario o contraseña incorrectos' });
      }

      if (user.estado !== 'activo') {
        appendAudit(user.id, user.usuario, 'LOGIN_RECHAZADO', { motivo: 'Usuario suspendido' });
        return res.status(401).json({ error: 'usuario suspendido, contacte al administrador' });
      }

      // Update ultimoAcceso
      user.ultimoAcceso = new Date().toISOString();
      saveUsers(users);

      // Create signed session token expiring in 8 hours (Rule 4)
      const sessionToken = crypto.randomUUID();
      const eightHoursMs = 8 * 60 * 60 * 1000;
      activeSessions.set(sessionToken, {
        userId: user.id,
        expiresAt: Date.now() + eightHoursMs,
      });

      res.cookie(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        signed: true,
        maxAge: eightHoursMs,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      appendAudit(user.id, user.usuario, 'LOGIN_EXITOSO');

      return res.json({
        ok: true,
        user: sanitizeUser(user),
      });
    } catch (error: any) {
      console.error('Error en /api/login:', error);
      return res.status(500).json({ error: 'Error interno en inicio de sesión' });
    }
  });

  // POST /api/logout (elimina la cookie de sesión)
  app.post('/api/logout', (req: Request, res: Response) => {
    const token = req.signedCookies[SESSION_COOKIE_NAME];
    if (token) {
      activeSessions.delete(token);
    }
    res.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      signed: true,
      sameSite: 'lax',
    });
    return res.json({ ok: true, message: 'Sesión cerrada exitosamente' });
  });

  // GET /api/yo (devuelve el usuario conectado)
  app.get('/api/yo', (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (user.estado !== 'activo') {
      return res.status(401).json({ error: 'usuario suspendido, contacte al administrador' });
    }
    return res.json({
      ok: true,
      user: sanitizeUser(user),
    });
  });

  // POST /api/cambiar-clave (mínimo 8 caracteres, al menos un número)
  app.post('/api/cambiar-clave', async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { nuevaClave, newPassword } = req.body;
    const targetPassword = nuevaClave || newPassword;

    if (!targetPassword || typeof targetPassword !== 'string') {
      return res.status(400).json({ error: 'Debe ingresar la nueva contraseña.' });
    }

    // Regla: mínimo 8 caracteres, al menos un número
    if (targetPassword.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres.' });
    }

    if (!/\d/.test(targetPassword)) {
      return res.status(400).json({ error: 'La contraseña debe contener al menos un número.' });
    }

    try {
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(targetPassword, salt);

      const users = readUsers();
      const userIndex = users.findIndex((u) => u.id === user.id);
      if (userIndex === -1) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      users[userIndex].passwordHash = newHash;
      users[userIndex].debeCambiarClave = false;
      saveUsers(users);

      appendAudit(user.id, user.usuario, 'CAMBIO_CLAVE_EXITOSO');

      return res.json({
        ok: true,
        message: 'Contraseña actualizada exitosamente',
        user: sanitizeUser(users[userIndex]),
      });
    } catch (err: any) {
      console.error('Error al cambiar contraseña:', err);
      return res.status(500).json({ error: 'Error al actualizar contraseña' });
    }
  });

  // ==========================================
  // COMPARATOR ENDPOINTS (Protected with requireAuth)
  // ==========================================

  // Endpoint to serve preloaded sample proposals (Rule 5: requires valid session and active user)
  app.get('/api/sample-proposals', requireAuth, async (_req: Request, res: Response) => {
    try {
      const sampleFiles = [
        {
          id: 'sample-1',
          name: 'Propuesta_A_Aseguradora_Cordillera.pdf',
          filename: 'Propuesta_A_Aseguradora_Cordillera_45e2b828.pdf',
          company: 'Aseguradora Cordillera S.A.',
        },
        {
          id: 'sample-2',
          name: 'Propuesta_B_Seguros_Alborada.pdf',
          filename: 'Propuesta_B_Seguros_Alborada_26bdc3b0.pdf',
          company: 'Seguros Alborada',
        },
        {
          id: 'sample-3',
          name: 'Propuesta_C_Protectora_del_Valle.pdf',
          filename: 'Propuesta_C_Protectora_del_Valle_422f9421.pdf',
          company: 'Protectora del Valle',
        },
      ];

      const loaded = [];
      for (const item of sampleFiles) {
        const filePath = path.join(__dirname, 'public', 'assets', 'aistudio', item.filename);
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          loaded.push({
            id: item.id,
            name: item.name,
            company: item.company,
            base64: fileBuffer.toString('base64'),
            size: fileBuffer.length,
          });
        }
      }

      return res.json({ samples: loaded });
    } catch (error) {
      console.error('Error reading sample files:', error);
      return res.status(500).json({ error: 'No se pudieron cargar los archivos de ejemplo' });
    }
  });

  // Endpoint to process proposals with Gemini (Rule 5: requires valid session and active user)
  app.post('/api/compare', requireAuth, async (req: Request, res: Response) => {
    req.setTimeout(180000);
    res.setTimeout(180000);
    try {
      const currentUser = (req as any).user;
      const { proposals, profile } = req.body;

      if (!proposals || !Array.isArray(proposals) || proposals.length === 0) {
        return res.status(400).json({ error: 'Debe cargar al menos una propuesta en formato PDF.' });
      }

      if (proposals.length > 3) {
        return res.status(400).json({ error: 'Máximo 3 propuestas permitidas.' });
      }

      if (!profile) {
        return res.status(400).json({ error: 'Falta la información del perfil del cliente.' });
      }

      const clientName = profile.name || 'No indicado';
      const vehicleAndUse = profile.vehicleAndUse || 'No indicado';
      const maxBudget = Number(profile.maxBudget) || 0;
      const mandatoryCoverages: string[] = profile.mandatoryCoverages || [];
      const priorities = profile.priorities || 'Ninguna especificada';
      const preferredPayment = profile.preferredPayment || 'No especificada';

      const coverageLabels: Record<string, string> = {
        colision: 'Colisión y vuelco',
        robo: 'Robo total / parcial',
        asistencia_vial: 'Asistencia vial 24/7',
        fenomenos_naturales: 'Fenómenos naturales (inundación, deslizamiento, etc.)',
        vehiculo_sustituto: 'Vehículo sustituto',
      };

      const selectedCoveragesText = mandatoryCoverages.length > 0
        ? mandatoryCoverages.map((c) => coverageLabels[c] || c).join(', ')
        : 'Ninguna marcada como obligatoria';

      // Build parts for Gemini
      const promptParts: any[] = [];

      for (let i = 0; i < proposals.length; i++) {
        const prop = proposals[i];
        promptParts.push({
          text: `=== DOCUMENTO #${i + 1}: PROPUESTA DE SEGURO "${prop.name}" ===\n`
        });
        const cleanBase64 = (prop.base64 || '').replace(/^data:application\/pdf;base64,/, '');
        promptParts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: cleanBase64,
          },
        });
      }

      const systemPrompt = `Eres un asesor técnico experto de Banco de Colombia.
Tu tarea es analizar minuciosamente los documentos PDF de las propuestas de seguro de automóvil adjuntas y contrastarlas estrictamente contra el perfil del cliente.

PERFIL DEL CLIENTE:
- Nombre: ${clientName}
- Vehículo y uso: ${vehicleAndUse}
- Presupuesto máximo anual: ₡ ${maxBudget.toLocaleString('es-CR')} (colones)
- Coberturas obligatorias marcadas por el cliente: ${selectedCoveragesText}
- Prioridades del cliente: ${priorities}
- Forma de pago preferida: ${preferredPayment}

REGLAS ESTRICTAS DE EXTRACCIÓN Y LÓGICA:
1. Extraer de cada PDF solo lo que dice el documento; si un dato no aparece, escribir exactamente "no indicado". No inventar datos ni asumir coberturas.
2. Validar "CABE EN PRESUPUESTO":
   - Debe ser "Sí" si la prima anual (IVA incluido) es MENOR O IGUAL al presupuesto máximo (₡ ${maxBudget.toLocaleString('es-CR')}).
   - Debe ser "No" si la prima anual supera el presupuesto.
3. Validar "CUMPLE OBLIGATORIAS":
   - Debe ser "Sí" SOLO SI TODAS las coberturas marcadas como obligatorias (${selectedCoveragesText}) están INCLUIDAS en la prima base indicada.
   - Si una cobertura requerida se ofrece como paquete opcional con costo adicional (por ejemplo, si "Asistencia Plus" cuesta ₡45.000 adicionales), NO CUENTA como incluida en la prima base.
   - Si falta una o más coberturas obligatorias, responder "No: falta [indicar cuáles coberturas no están incluidas o son opcionales con costo extra]".
4. SEMÁFORO (Asignar uno de estos tres colores con total rigor):
   - "verde": si CABE EN PRESUPUESTO ("Sí") Y CUMPLE OBLIGATORIAS ("Sí").
   - "amarillo": si CUMPLE OBLIGATORIAS ("Sí") pero NO CABE EN PRESUPUESTO ("No").
   - "rojo": si NO CUMPLE OBLIGATORIAS ("No"), independientemente de si cabe o no en el presupuesto.
5. RECOMENDACIÓN PRELIMINAR (BORRADOR):
   - Recomendar UNA SOLA propuesta.
   - Justificada en MÁXIMO 5 LÍNEAS con los montos exactos en colones, evaluando de forma directa las prioridades del cliente ("${priorities}").
   - Si una propuesta con semáforo amarillo satisface mejor las prioridades del cliente, indícalo claramente y cuantifica de forma precisa la diferencia de prima frente al presupuesto o las otras opciones.
6. MENSAJE SUGERIDO PARA EL CLIENTE (WHATSAPP):
   - Formato para WhatsApp (puedes usar *negrita* con asteriscos, sin tecnicismos complejos).
   - MÁXIMO 8 LÍNEAS.
   - Tono cordial y profesional de asesor de Banco de Colombia.
   - Debe contener: la recomendación concreta, dos razones claras, la alternativa evaluada y un próximo paso claro para avanzar.
   - SIN prometer plazos de emisión o respuesta.

Devuelve estrictamente un objeto JSON conforme al esquema proporcionado.`;

      promptParts.push({ text: systemPrompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptParts,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              comparisons: {
                type: Type.ARRAY,
                description: 'Lista de análisis comparativo por cada propuesta/PDF cargado.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: 'ID de la propuesta correspondiente o número' },
                    aseguradora: { type: Type.STRING, description: 'Nombre de la aseguradora y plan cotizado' },
                    prima_anual: { type: Type.STRING, description: 'Prima anual total en colones (ej: ₡ 395.000 IVA incluido)' },
                    prima_anual_numerica: { type: Type.NUMBER, description: 'Valor numérico de la prima en colones (ej: 395000)' },
                    cabe_en_presupuesto: { type: Type.STRING, description: '"Sí" o "No" junto con breve explicación si excede' },
                    deducible_colision: { type: Type.STRING, description: 'Deducible por evento de colisión y vuelco' },
                    deducible_robo: { type: Type.STRING, description: 'Deducible por robo total y/o parcial' },
                    rc_danos_terceros: { type: Type.STRING, description: 'Límite de RC daños a bienes de terceros' },
                    rc_lesiones: { type: Type.STRING, description: 'Límite de RC lesiones o muerte a terceros' },
                    asistencia_vial_24_7: { type: Type.STRING, description: 'Detalle de Asistencia vial 24/7 (incluida, opcional con costo, o no indicada)' },
                    grua: { type: Type.STRING, description: 'Límites de servicio de grúa (km y eventos)' },
                    vehiculo_sustituto: { type: Type.STRING, description: 'Detalle de vehículo sustituto (días o si no está incluido)' },
                    fenomenos_naturales: { type: Type.STRING, description: 'Cobertura de fenómenos naturales (inundación, deslizamiento, etc.)' },
                    rotura_cristales: { type: Type.STRING, description: 'Cobertura de rotura de cristales y deducible' },
                    exclusiones_destacadas: { type: Type.STRING, description: 'Principales exclusiones destacadas en el documento' },
                    cumple_obligatorias: { type: Type.STRING, description: '"Sí" o "No: falta [detalle]"' },
                    semaforo: { type: Type.STRING, description: '"verde", "amarillo" o "rojo"' },
                    semaforo_razon: { type: Type.STRING, description: 'Motivo conciso de la asignación del color del semáforo' },
                  },
                  required: [
                    'aseguradora',
                    'prima_anual',
                    'prima_anual_numerica',
                    'cabe_en_presupuesto',
                    'deducible_colision',
                    'deducible_robo',
                    'rc_danos_terceros',
                    'rc_lesiones',
                    'asistencia_vial_24_7',
                    'grua',
                    'vehiculo_sustituto',
                    'fenomenos_naturales',
                    'rotura_cristales',
                    'exclusiones_destacadas',
                    'cumple_obligatorias',
                    'semaforo',
                    'semaforo_razon',
                  ],
                },
              },
              recomendacion_preliminar: {
                type: Type.STRING,
                description: 'Recomendación preliminar (borrador) de máximo 5 líneas con montos y justificación',
              },
              mensaje_whatsapp: {
                type: Type.STRING,
                description: 'Mensaje sugerido para WhatsApp, máximo 8 líneas, cordial, sin tecnicismos, con recomendación, 2 razones, alternativa y próximo paso sin plazos',
              },
            },
            required: ['comparisons', 'recomendacion_preliminar', 'mensaje_whatsapp'],
          },
        },
      });

      const responseText = response.text || '{}';
      const parsedData = JSON.parse(responseText);

      // Persist comparison in data/comparaciones.json associated with usuarioId (Rule 9)
      appendComparison(currentUser.id, {
        profile,
        proposals: proposals.map((p: any) => ({ id: p.id, name: p.name })),
        resultado: parsedData,
      });

      // Audit log in data/auditoria.json (Rule 9)
      appendAudit(currentUser.id, currentUser.usuario, 'COMPARACION_REALIZADA', {
        cliente: clientName,
        vehiculo: vehicleAndUse,
        proposalsCount: proposals.length,
      });

      return res.json(parsedData);
    } catch (error: any) {
      console.error('Error al procesar propuestas con Gemini:', error);
      return res.status(500).json({
        error: error.message || 'Ocurrió un error al analizar las propuestas con Gemini.',
      });
    }
  });

  // Optional extract client profile endpoint for completeness (Rule 5: requires valid session)
  app.post('/api/extract-client-profile', requireAuth, async (_req: Request, res: Response) => {
    return res.json({ ok: true });
  });

  // In development, hook up Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve built files
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Comparador de Propuestas Banco de Colombia corriendo en http://0.0.0.0:${PORT}`);
  });

  // Ensure ample timeout for multimodal PDF processing
  server.headersTimeout = 180000;
  server.requestTimeout = 180000;
  server.keepAliveTimeout = 90000;
}

startServer();

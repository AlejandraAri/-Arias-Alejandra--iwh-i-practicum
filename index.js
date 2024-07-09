const express = require('express');
const axios = require('axios');
const app = express();

app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PRIVATE_APP_ACCESS = '';  // Reemplaza con tu token de acceso privado

// Ruta GET para la página de inicio ("/")
app.get('/', async (req, res) => {
    const customObjectsUrl = 'https://api.hubapi.com/crm/v3/objects/contacts?properties=email,firstname,lastname,city'; // Reemplaza con el endpoint para contactos y propiedades específicas
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    };
    try {
        const response = await axios.get(customObjectsUrl, { headers });
        const data = response.data.results;
        res.render('home', { title: 'Home | HubSpot APIs', data });  // Usa la plantilla home.pug
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving custom object data');
    }
});

// Ruta GET para el formulario HTML ("/update-cobj")
app.get('/update-cobj', (req, res) => {
    res.render('updates', { title: 'Formulario de actualización de objeto personalizado | Integración con HubSpot I Práctica' });
});

// Ruta POST para enviar los datos capturados por el formulario HTML ("/update-cobj")
app.post('/update-cobj', async (req, res) => {
    const customObjectData = {
        properties: {
            email: req.body.email,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            city: req.body.city
        }
    };

    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    };

    // Buscar el contacto por email para obtener su ID
    const searchUrl = `https://api.hubapi.com/crm/v3/objects/contacts/search`;
    const searchData = {
        filterGroups: [{
            filters: [{
                propertyName: 'email',
                operator: 'EQ',
                value: req.body.email
            }]
        }]
    };

    try {
        const searchResponse = await axios.post(searchUrl, searchData, { headers });
        if (searchResponse.data.results.length > 0) {
            // Contacto existente encontrado, actualizar
            const contactId = searchResponse.data.results[0].id;
            const updateUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`;
            await axios.patch(updateUrl, customObjectData, { headers });
        } else {
            // No se encontró contacto, crear uno nuevo
            const createUrl = 'https://api.hubapi.com/crm/v3/objects/contacts';
            await axios.post(createUrl, customObjectData, { headers });
        }
        res.redirect('/');
    } catch (error) {
        console.error("Error details:", error.response ? error.response.data : error.message);
        res.status(500).send('Error creating or updating custom object data');
    }
});

// Localhost
app.listen(3000, () => console.log('Listening on http://localhost:3000'));
const express = require('express');
const axios = require('axios');
const app = express();

app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PRIVATE_APP_ACCESS = 'pat-na1-bfc27286-d994-48ff-b197-04e636341953';

// Ruta GET para la página de inicio ("/")
app.get('/', async (req, res) => {
    const customObjectsUrl = 'https://api.hubapi.com/crm/v3/objects/2-32325333?properties=nombre_del_proyecto,tipo_de_proyecto,gerente_del_proyecto';
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
            nombre_del_proyecto: req.body.nombre_del_proyecto,
            tipo_de_proyecto: req.body.tipo_de_proyecto,
            gerente_del_proyecto: req.body.gerente_del_proyecto
        }
    };

    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    };

    // Buscar el objeto personalizado por nombre del proyecto para obtener su ID
    const searchUrl = 'https://api.hubapi.com/crm/v3/objects/2-32325333/search';
    const searchData = {
        filterGroups: [{
            filters: [{
                propertyName: 'nombre_del_proyecto',
                operator: 'EQ',
                value: req.body.nombre_del_proyecto
            }]
        }]
    };

    try {
        const searchResponse = await axios.post(searchUrl, searchData, { headers });
        if (searchResponse.data.results.length > 0) {
            // Objeto personalizado existente encontrado, actualizar
            const objectId = searchResponse.data.results[0].id;
            const updateUrl = `https://api.hubapi.com/crm/v3/objects/2-32325333/${objectId}`;
            await axios.patch(updateUrl, customObjectData, { headers });
        } else {
            // No se encontró objeto personalizado, crear uno nuevo
            const createUrl = 'https://api.hubapi.com/crm/v3/objects/2-32325333';
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

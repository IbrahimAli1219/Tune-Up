require('dotenv').config();

const express = require('express');
const dotenv = require('dotenv');
dotenv.config(); 
const app = express();
const session = require('express-session');

app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: 'auto' } 
}));




app.get('/', (req, res) => {
    res.send('Welcome to Tune Up!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const SpotifyWebApi = require('spotify-web-api-node');



const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});


app.get('/login', (req, res) => {
    res.set('Cache-Control', 'no-store');

    const scopes = ['user-read-private', 'user-read-email', 'playlist-read-private', 'user-top-read'];
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
    res.redirect(authorizeURL);
});


// Callback route for after Spotify has authenticated the user
app.get('/callback', (req, res) => {
    const { code } = req.query;
    spotifyApi.authorizationCodeGrant(code).then(data => {
        const { access_token, refresh_token } = data.body;
        spotifyApi.setAccessToken(access_token);
        spotifyApi.setRefreshToken(refresh_token);

        
        res.redirect('/dashboard');
    }).catch(err => {
        console.error('Something went wrong when retrieving an access token', err);
        res.send('Failed to retrieve access token');
    });
});

app.get('/dashboard', (req, res) => {
    res.send(`
        <h1>Welcome to Tune Up! A new way to discover music.</h1>
        <a href="/logout">Logout</a>
    `);
});


app.get('/top-tracks', (req, res) => {
    spotifyApi.getMyTopTracks().then(data => {
        res.json(data.body.items);
    }).catch(err => {
        console.error('Failed to fetch top tracks', err);
        res.status(400).send('Failed to fetch top tracks');
    });
});

app.get('/logout', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // HTTP 1.1.
res.setHeader('Pragma', 'no-cache'); // HTTP 1.0.
res.setHeader('Expires', '0'); // Proxies.


    console.log('Attempting to destroy session');
    if (req.session) {
        req.session.destroy(err => {
            console.log('Session destroyed, redirecting to login');
            res.redirect('/login');
        });
    } else {
        console.log('No session found, redirecting to login');
        res.redirect('/login');
    }
}); 


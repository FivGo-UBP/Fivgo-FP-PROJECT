export const environment = {
  production: true,
  // apiUrl: 'https://fivgo.my.id/api',
  apiUrl: 'http://localhost:8000/api',
  googleClientId: '862119022448-4kb0mruajin4b7o4178cviibgr8564he.apps.googleusercontent.com',
  tomtomApiKey: 'Uoy1BjIHY1Grg9HIUlti3lLs4v4dxebL', // Ganti dengan API key TomTom Anda
  mapboxApiKey: 'pk.eyJ1IjoiZml2Z28iLCJhIjoiY21wNHJhbjVrMDk4cjMyc2FmZTY3cjd6MiJ9.V3nFs9HLLnBEclngluui6A', // Ganti dengan API key Mapbox Anda
  reverb: {
    broadcaster: 'pusher',
    key: 'fb9771855a950d57ce43',
    cluster: 'ap1',
    host: 'api-ap1.pusher.com',
    port: 443,
    scheme: 'https'
  }
};

// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // apiUrl: 'https://fivgo.my.id/api',
  apiUrl: 'http://localhost:8000/api',
  googleClientId: '862119022448-4kb0mruajin4b7o4178cviibgr8564he.apps.googleusercontent.com',
  tomtomApiKey: 'Uoy1BjIHY1Grg9HIUlti3lLs4v4dxebL',
  mapboxApiKey: 'pk.eyJ1IjoiZml2Z28iLCJhIjoiY21wNHJhbjVrMDk4cjMyc2FmZTY3cjd6MiJ9.V3nFs9HLLnBEclngluui6A',
  reverb: {
    broadcaster: 'pusher',
    key: 'fb9771855a950d57ce43',
    cluster: 'ap1',
    host: 'api-ap1.pusher.com',
    port: 443,
    scheme: 'https'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.

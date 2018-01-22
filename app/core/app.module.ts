import { NgModule, ApplicationRef }         from '@angular/core';
import { BrowserModule }                    from '@angular/platform-browser';
import { RouterModule, RouteReuseStrategy } from '@angular/router';
import { HttpClientModule }                 from '@angular/common/http';

import { OAuthModule }                      from 'angular-oauth2-oidc';

import { ServicesModule }                   from 'services/services.module';
import { LayoutsModule }                    from 'layouts/layouts.module';
import { PagesModule }                      from 'pages/pages.module';

import { AppComponent }                     from './app.component';
import { CustomRouteReuseStrategy }         from './app.definitions';

import {
  removeNgStyles,
  createNewHosts,
  createInputTransfer
} from '@angularclass/hmr';

import 'styles/index.scss';


@NgModule({
  imports: [
    RouterModule.forRoot([], { useHash: true, onSameUrlNavigation: 'reload' }),
    BrowserModule,
    HttpClientModule,

    OAuthModule.forRoot(),

    ServicesModule,
    LayoutsModule,
    PagesModule
  ],

  providers: [
    {
      provide: RouteReuseStrategy,
      useClass: CustomRouteReuseStrategy
    }
  ],

  declarations: [ AppComponent ],
  bootstrap:    [ AppComponent ]
})

export class AppModule {
  constructor(public appRef: ApplicationRef) { }

  hmrOnInit(store: any) {
    if (!store || !store.state) return;

    // Inject AppStore here and update it
    // this.AppStore.update(store.state)
    if ('restoreInputValues' in store) {
      store.restoreInputValues();
    }
    // Change detection
    this.appRef.tick();
    delete store.state;
    delete store.restoreInputValues;
  }

  hmrOnDestroy(store: any) {
    var cmpLocation = this.appRef.components.map(cmp => cmp.location.nativeElement);

    // Recreate elements
    store.disposeOldHosts = createNewHosts(cmpLocation)

    // Inject your AppStore and grab state then set it on store
    // var appState = this.AppStore.get()
    store.state = {};

    // Store.state = Object.assign({}, appState)
    // save input values
    store.restoreInputValues  = createInputTransfer();

    // Remove styles
    removeNgStyles();
  }

  hmrAfterDestroy(store: any) {

    // Display new elements
    store.disposeOldHosts()
    delete store.disposeOldHosts;

    // Anything you need done the component is removed
  }
}

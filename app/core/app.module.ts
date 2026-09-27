import { NgModule, provideZoneChangeDetection } from '@angular/core';
import { BrowserModule }                    from '@angular/platform-browser';
import { RouterModule, RouteReuseStrategy } from '@angular/router';
import {
  provideHttpClient,
  withInterceptorsFromDi
} from '@angular/common/http';

import { provideOAuthClient }               from 'angular-oauth2-oidc';

import { ServicesModule }                   from 'services/services.module';
import { LayoutsModule }                    from 'layouts/layouts.module';
import { PagesModule }                      from 'pages/pages.module';

import { AppComponent }                     from './app.component';
import { CustomRouteReuseStrategy }         from './app.definitions';


@NgModule({
  imports: [
    RouterModule.forRoot([], { useHash: true, onSameUrlNavigation: 'reload' }),
    BrowserModule,

    ServicesModule,
    LayoutsModule,
    PagesModule
  ],

  providers: [
    provideZoneChangeDetection(),
    provideHttpClient(withInterceptorsFromDi()),
    provideOAuthClient(),

    {
      provide: RouteReuseStrategy,
      useClass: CustomRouteReuseStrategy
    }
  ],

  declarations: [ AppComponent ],
  bootstrap:    [ AppComponent ]
})

export class AppModule { }

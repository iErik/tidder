import { NgModule }             from '@angular/core';
import { CommonModule }         from '@angular/common';
import { RouterModule }         from '@angular/router';

import { ComponentsModule }     from 'components/components.module';

import { RootLayout }           from './root.layout';
import { SidebarComponent }     from './components/sidebar';
import { TopbarComponent }      from './components/topbar';
import { LoginScreenComponent } from './components/login-screen';

@NgModule({
  imports: [
    RouterModule.forChild([]),
    CommonModule,

    ComponentsModule
  ],

  declarations: [
    RootLayout,
    SidebarComponent,
    TopbarComponent,
    LoginScreenComponent
  ],

  exports: [ RootLayout ]
})
export class RootLayoutModule { }

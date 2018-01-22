import { NgModule }             from '@angular/core';
import { CommonModule }         from '@angular/common';
import { RouterModule }         from '@angular/router';

import { ComponentsModule }     from 'components/';

import { RootLayout }           from './root.layout';
import { SidebarComponent }     from './components/sidebar';
import { TopbarComponent }      from './components/topbar';

@NgModule({
  imports: [
    RouterModule.forChild([]),
    CommonModule,

    ComponentsModule
  ],

  declarations: [
    RootLayout,
    SidebarComponent,
    TopbarComponent
  ],

  exports: [ RootLayout ]
})
export class RootLayoutModule { }

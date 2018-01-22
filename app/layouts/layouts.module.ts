import { NgModule } from '@angular/core';

import { RootLayoutModule } from './root-layout/root.module';

@NgModule({
  imports: [ RootLayoutModule ],
  exports: [ RootLayoutModule ],
})

export class LayoutsModule { }

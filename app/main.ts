import { platformBrowser }        from '@angular/platform-browser';
import { AppModule }              from 'core/app.module';

platformBrowser()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));

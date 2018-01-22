import {
  RouteReuseStrategy,
  ActivatedRouteSnapshot,
  DetachedRouteHandle
} from '@angular/router';

// We'll only be able to have the full picture of the right
// route reuse strategy once we have implemented lazy loading
// in our router.
export class CustomRouteReuseStrategy extends RouteReuseStrategy {
  private handlers: {[key: string]: DetachedRouteHandle} = {};

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return false;
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return false;
  }

  store(route: ActivatedRouteSnapshot, detachedTree: DetachedRouteHandle): void {

  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle|null {
    return null;
  }

  shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    curr: ActivatedRouteSnapshot): boolean {
      let futureName = future.component && (<any>future.component).name;
      let currName = curr.component && (<any>curr.component).name;

      return  futureName === currName;
    }
}

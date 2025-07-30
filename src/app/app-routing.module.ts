import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainpageComponent } from './mainpage/mainpage.component';
import { IframepageComponent } from './iframepage/iframepage.component';

const routes: Routes = [
  { path: 'mainpage', component: MainpageComponent },
  { path: 'iframepage', component: IframepageComponent },
  { path: '', redirectTo: '/mainpage', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

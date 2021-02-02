import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatComponent } from './chat/chat.component';
import { CreateComponent } from './create/create.component';

const routes: Routes = [
  { path: 'chat/:prefix', component: ChatComponent },
  { path: 'new', component: CreateComponent },
  { path: '**', redirectTo: '/new', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

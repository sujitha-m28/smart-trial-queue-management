import { Routes } from '@angular/router';
import { CustomerQueueComponent } from './components/customer/customer-queue.component';
import { StaffDashboardComponent } from './components/staff/staff-dashboard.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard.component';
import { PublicDisplayComponent } from './components/display/public-display.component';
import { LoginComponent } from './components/auth/login.component';
import { adminGuard, staffGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'customer', pathMatch: 'full' },
  { path: 'customer', component: CustomerQueueComponent },
  { path: 'login', component: LoginComponent },
  { path: 'staff', component: StaffDashboardComponent, canActivate: [staffGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [adminGuard] },
  { path: 'display/:storeCode', component: PublicDisplayComponent },
  { path: '**', redirectTo: 'customer' }
];

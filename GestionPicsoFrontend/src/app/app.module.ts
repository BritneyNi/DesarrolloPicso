import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // <--- esto

@NgModule({
  

  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule, // <--- esto permite usar [formGroup]
  ]
})
export class AppModule { }

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FiltersModule } from './filters';
import { PlaygroundComponent } from './playground/playground.component';

@NgModule({
    declarations: [AppComponent, PlaygroundComponent],
    imports: [BrowserModule, AppRoutingModule, FiltersModule, BrowserAnimationsModule],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}

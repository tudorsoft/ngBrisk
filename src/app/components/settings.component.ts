//settings.component.ts:
//---------------------
import { HttpClient        } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule      } from '@angular/common';
import { FormsModule       } from '@angular/forms';
import { StorageService    } from '../services/storage.service';

@Component({
  selector: 'app-settings',
  //standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: [ './settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  data: any = [];
  cUrlInput: string = ''; // Fără 'null'
  cUrlSaved: string = '';

  constructor( public storageService: StorageService, private http: HttpClient ) {}

  ngOnInit() {
    this.cUrlInput = this.storageService.cDatabaseUrl;
    this.cUrlSaved = this.storageService.cDatabaseUrl;
  }

  saveURL() {
    if (this.cUrlInput.endsWith('/')) {
      this.cUrlInput = this.cUrlInput.slice(0, -1);
    }
  
    this.storageService.setVar('cDatabaseUrl', this.cUrlInput);
    this.cUrlSaved = this.storageService.cDatabaseUrl;
  }
}
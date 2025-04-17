  //field-renderer.component.ts:
  //---------------------------
  import { Component, Input, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormControl, ReactiveFormsModule } from '@angular/forms';
  import { HttpHeaders } from '@angular/common/http';
  import { MatFormFieldModule } from '@angular/material/form-field';
  import { MatInputModule } from '@angular/material/input';
  import { MatCheckboxModule } from '@angular/material/checkbox';
  import { MatDatepickerModule } from '@angular/material/datepicker';
  import { MatNativeDateModule } from '@angular/material/core';
  import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
  import { MatIconModule } from '@angular/material/icon';
  import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

  import { FieldDefinition } from './type-definition';
  import { getSqlString } from '../utils/sql.utils';
  import { HttpProxyService } from '../services/http-proxy.service';
  import { StorageService } from '../services/storage.service';

  @Component({
    standalone: true,
    selector: 'app-field-renderer',
    imports: [
      CommonModule,
      ReactiveFormsModule,
      MatFormFieldModule,
      MatInputModule,
      MatCheckboxModule,
      MatDatepickerModule,
      MatNativeDateModule,
      MatAutocompleteModule,
      MatIconModule,
      MatProgressSpinnerModule
    ],
    templateUrl: './field-renderer.component.html',
    styleUrls: ['./field-renderer.component.scss'], 
  })
  export class FieldRendererComponent {
    @Input() field!: FieldDefinition;
    @Input() control!: FormControl;

    isLoading: { [key: string]: boolean } = {};
    isFocused: boolean = false; 
    autocompleteOptions: { [key: string]: any[] } = {};

    @ViewChild(MatAutocompleteTrigger, { static: false }) autoTrigger?: MatAutocompleteTrigger;
    @ViewChild('autoInput', { read: ElementRef }) autoInput!: ElementRef<HTMLInputElement>;

    private suppressAutoOpen = false;

    constructor(
      private httpProxyService: HttpProxyService,
      private storageService: StorageService,
      private cd: ChangeDetectorRef
    ) {}

    triggerAutocomplete(field: FieldDefinition, inputElement: HTMLInputElement): void {
      let sqlDep = '';
      if (field.dependency) {
        const depVal = this.control.root.get(field.dependency.fieldName)?.value;
        if (depVal && field.dependency.sql && field.dependency.sqlval) {
          sqlDep = field.dependency.sql +
                  (typeof depVal === 'object'
                    ? depVal[field.dependency.sqlval]
                    : depVal);
        } else {
          this.autocompleteOptions[field.name] = [];
          return;
        }
      }
      const query = getSqlString(field.sql || '', inputElement.value, sqlDep) || '';
      this.isLoading[field.name] = true;
      const body = { autocomplete: true, sql: query };

      this.httpProxyService
        .post<any[]>(`${this.storageService.cDatabaseUrl}/wngSQL`, body,
          undefined,
          new HttpHeaders({ 'Content-Type': 'application/json' })
        )
        .subscribe(
          opts => {
            this.autocompleteOptions[field.name] = opts;
            this.isLoading[field.name] = false;
            this.cd.detectChanges();
          },
          () => {
            this.autocompleteOptions[field.name] = [];
            this.isLoading[field.name] = false;
            this.cd.detectChanges();
          }
        );
    }

    displayAutocompleteFactory(fieldName: string): (opt: any) => string {
      return (opt: any) => {
        if (!opt) return '';
        return typeof opt === 'string' ? opt : (opt[fieldName] || '');
      };
    }

    togglePanel(trigger: MatAutocompleteTrigger | undefined, inputElem: HTMLInputElement): void {
      if (!trigger) return;         // protecție
      if (trigger.panelOpen) {
        this.suppressAutoOpen = true;
        trigger.closePanel();
        inputElem.blur();
      } else {
        this.suppressAutoOpen = false;
        trigger.openPanel();
        inputElem.focus();
      }
    }

    onInputFocus(): void {
      this.isFocused = true;
      if (this.suppressAutoOpen) {
        this.autoTrigger?.closePanel();
        this.autoInput.nativeElement.blur();
        this.suppressAutoOpen = false;
        return;
      }
      this.triggerAutocomplete(this.field, this.autoInput.nativeElement);
    }

    onInputChange(event: Event): void {
      const input = event.target as HTMLInputElement;
      this.triggerAutocomplete(this.field, input);

      if (this.field.reset) {
        (this.control.root.get(this.field.reset) as FormControl).setValue(null);
        this.autocompleteOptions[this.field.reset] = [];
        (this.control.root.get(this.field.reset) as FormControl).updateValueAndValidity();
      }
    }
    onInputBlur(): void {
      this.isFocused = false;
    }
    onClearMouseDown(evt: MouseEvent) {
      evt.preventDefault();        // opreşte luarea focusului de pe input
      this.clearInput();           // goleşte valoarea și opțiunile
    }

    clearInput(): void {
      this.control.setValue('');
      this.autocompleteOptions[this.field.name] = [];
      // dacă totuşi vrei să dai blur după ce goleşti:
      // this.autoInput.nativeElement.blur();
      this.cd.detectChanges();
    }
  }
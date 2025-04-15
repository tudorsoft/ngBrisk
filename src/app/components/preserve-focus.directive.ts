// preserve-focus.directive.ts

import { Directive, ElementRef, Input, OnChanges, SimpleChanges, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appPreserveFocus]'
})
export class PreserveFocusDirective implements OnChanges {
  // Această proprietate va primi valoarea ce trebuie setată în input
  @Input('appPreserveFocus') valueToSet!: string;
  constructor(private el: ElementRef, private renderer: Renderer2) {}
  ngOnChanges(changes: SimpleChanges): void {
    if (document.activeElement !== this.el.nativeElement) {
      this.renderer.setProperty(this.el.nativeElement, 'value', this.valueToSet || '');
      this.el.nativeElement.focus();
    }
  }
}

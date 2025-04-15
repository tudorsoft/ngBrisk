import { Directive, ElementRef, Input, Renderer2, AfterViewInit, RendererStyleFlags2 } from '@angular/core';
@Directive({
  selector: '[setCustomWidth]'
})
export class SetCustomWidthDirective implements AfterViewInit {
  @Input() setCustomWidth!: string;
  
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    this.renderer.setStyle(this.el.nativeElement, 'width', this.setCustomWidth, RendererStyleFlags2.Important);
  }
}
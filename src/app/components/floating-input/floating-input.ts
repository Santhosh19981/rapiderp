import { Component, forwardRef, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-floating-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './floating-input.html',
  styleUrl: './floating-input.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FloatingInput),
      multi: true,
    },
  ],
})
export class FloatingInput implements ControlValueAccessor {
  readonly id = input<string>('input-' + Math.random().toString(36).substring(2, 9));
  readonly label = input<string>('');
  readonly type = input<string>('text');
  readonly icon = input<'mail' | 'lock' | 'user' | 'none'>('none');
  readonly name = input<string>('');
  readonly required = input<boolean>(false);
  readonly autocomplete = input<string>('off');

  readonly valueChange = output<string>();

  val = signal<string>('');
  isFocused = signal<boolean>(false);
  showPassword = signal<boolean>(false);
  disabled = signal<boolean>(false);

  // ControlValueAccessor methods
  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: any): void {
    this.val.set(value || '');
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.val.set(target.value);
    this.onChange(target.value);
    this.valueChange.emit(target.value);
  }

  onFocus(): void {
    this.isFocused.set(true);
    this.onTouched();
  }

  onBlur(): void {
    this.isFocused.set(false);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((prev) => !prev);
  }

  get currentType(): string {
    if (this.type() === 'password') {
      return this.showPassword() ? 'text' : 'password';
    }
    return this.type();
  }

  get isFloating(): boolean {
    return this.isFocused() || (this.val() !== null && this.val() !== '');
  }
}

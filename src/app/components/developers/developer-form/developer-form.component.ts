import { Component, Inject, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Developer } from '../../../models/developer.model';
import { DeveloperService } from '../../../services/developer.service';
import { environment } from '../../../../environment/environments';

@Component({
  selector: 'app-developer-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './developer-form.component.html',
  styleUrls: ['./developer-form.component.css']
})
export class DeveloperFormComponent implements OnInit {
  developerForm!: FormGroup;
  @Input() isEditMode: boolean = false;
  logoPreview: string | ArrayBuffer | null = null;
  logoFile: File | null = null;

  constructor(
    private fb: FormBuilder, 
    private developerService: DeveloperService,
    private dialogRef: MatDialogRef<DeveloperFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      this.isEditMode = data.isEditMode;
    }

  ngOnInit(): void {
    this.developerForm = this.fb.group({
      developerName: ['', Validators.required],
      description: ['', Validators.required]
    });
    if (this.isEditMode && this.data.developer) {
      this.populateForm(this.data.developer);
    }
  }

  populateForm(developer: Developer): void {
    this.developerForm.patchValue({
      developerName: developer.developerName,
      description: developer.description || ''
    });
    if (developer.logo) {
      this.logoPreview = environment.backend + '/' + developer.logo; // Show the existing logo if editing
    }
  }

  onLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.logoFile = input.files[0];
      
      // Generate a preview
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result;
      };
      reader.readAsDataURL(this.logoFile);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.developerForm.valid) {
      const developerData = this.developerForm.value;
  
      // Prepare FormData for the backend
      const formData = new FormData();
      formData.append('developerName', developerData.developerName);
      formData.append('description', developerData.description);
  
      // Append logo file if present
      if (this.logoFile) {
        formData.append('logo', this.logoFile);
      } else if (this.isEditMode && this.data.developer?.logo) {
        // In edit mode, if no new logo is uploaded, keep the existing logo reference
        formData.append('logo', this.data.developer.logo);
      }
  
      // Call service method to submit the data
      this.developerService.addOrUpdateDeveloper(formData, this.isEditMode, this.data?.developer?._id).subscribe(
      {
        next: (response) => {
          console.log('Developer submitted successfully:', response);
          this.dialogRef.close(response); // Close dialog on success
        },
        error: (error) => {
          console.error('Error submitting developer:', error);
        }
      });
    }
  }
      
}

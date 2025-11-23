import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CameraService } from '../../../services/camera.service';
import { DeveloperService } from '../../../services/developer.service';
import { ProjectService } from '../../../services/project.service';
import { Camera } from '../../../models/camera.model';
import { Developer } from '../../../models/developer.model';
import { Project } from '../../../models/project.model';

@Component({
  selector: 'app-camera-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './camera-form.component.html',
  styleUrls: ['./camera-form.component.css']
})
export class CameraFormComponent implements OnInit {
  cameraForm: FormGroup;
  developers: Developer[] = [];
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  allAvailableProjects: Project[] = [];  // All projects for additional projects selection
  selectedDeveloper!: Developer;
  selectedProject!: Project;
  isEditing = false;

  constructor(
    private fb: FormBuilder,
    private cameraService: CameraService,
    private developerService: DeveloperService,
    private projectService: ProjectService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.cameraForm = this.fb.group({
      developer: ['', Validators.required],
      project: ['', Validators.required],
      cameraDescription: [''],
      lat: ['', Validators.required],
      lng: ['', Validators.required],
      isActive: [true],
      additionalProjects: [[]]  // Array of project IDs
    });
  }

  ngOnInit(): void {
    console.log(this.isEditing);
    this.loadDevelopers();
    this.loadAllProjects();  // Load all projects for additional projects selection

    this.route.paramMap.subscribe(params => {
      const developerId = params.get('developerId') ?? '';
      const projectId = params.get('projectId') ?? '';
      console.log(developerId, projectId);

      if (developerId && projectId) {
        this.isEditing = true;
        this.developerService.getDeveloperById(developerId).subscribe(developer => {
          this.selectedDeveloper = developer;
          this.cameraForm.patchValue({ developer: developer._id });
        });

        this.projectService.getProjectById(projectId).subscribe(project => {
          this.selectedProject = project;
          this.cameraForm.patchValue({ project: project._id });
        });
      } else {
        this.isEditing = false;
      }

      const cameraId = this.route.snapshot.paramMap.get('id');
      if (cameraId) {
        this.isEditing = false;  // Editing existing camera
        this.cameraService.getCameraById(cameraId).subscribe(camera => {
          this.developerService.getDeveloperById(camera.developer).subscribe(developer => {
            this.selectedDeveloper = developer;
          });
          this.projectService.getProjectById(camera.project).subscribe(project => {
            this.selectedProject = project;
          });
          this.cameraForm.patchValue({
            ...camera,
            additionalProjects: camera.additionalProjects || []
          });
          this.loadProjectsByDeveloper(camera.developer);
        });
      }
    });
  }

  loadDevelopers(): void {
    this.developerService.getAllDevelopers().subscribe({
      next: (developers) => (this.developers = developers),
      error: (error) => console.error('Error fetching developers:', error),
    });
  }

  loadProjectsByDeveloper(developerId: string): void {
    this.projectService.getProjectsByDeveloper(developerId).subscribe(projects => {
      this.projects = projects;
      this.filteredProjects = projects;
    });
  }

  loadAllProjects(): void {
    this.projectService.getAllProjects().subscribe(projects => {
      this.allAvailableProjects = projects;
    });
  }

  onDeveloperChange(event: Event): void {
    const developerId = (event.target as HTMLSelectElement).value;
    this.loadProjectsByDeveloper(developerId);
  }

  onSubmit(): void {
    if (this.cameraForm.valid) {
      const formValue = this.cameraForm.value;
      
      // Ensure additionalProjects is an array and exclude the main project
      const mainProjectId = formValue.project;
      let additionalProjects: string[] = [];
      
      // Handle multi-select: it can be a string (single value) or array
      if (formValue.additionalProjects) {
        if (Array.isArray(formValue.additionalProjects)) {
          additionalProjects = formValue.additionalProjects.filter((id: string) => id && id !== mainProjectId);
        } else if (typeof formValue.additionalProjects === 'string' && formValue.additionalProjects !== mainProjectId) {
          additionalProjects = [formValue.additionalProjects];
        }
      }
      
      // Prepare camera data as JSON object
      const cameraData: any = {
        developer: formValue.developer,
        project: formValue.project,
        cameraDescription: formValue.cameraDescription || '',
        lat: formValue.lat,
        lng: formValue.lng,
        isActive: formValue.isActive
      };
      
      // Add additionalProjects if any
      if (additionalProjects.length > 0) {
        cameraData.additionalProjects = additionalProjects;
      }

      const cameraId = this.route.snapshot.paramMap.get('id');
      if (cameraId) {
        // Editing existing camera - convert to FormData
        const formData = new FormData();
        Object.keys(cameraData).forEach(key => {
          if (key === 'additionalProjects') {
            formData.append(key, JSON.stringify(cameraData[key]));
          } else {
            formData.append(key, cameraData[key]);
          }
        });
        this.cameraService.updateCamera(cameraId, formData).subscribe({
          next: () => this.router.navigate(['/cameras']),
          error: (error) => console.error('Error updating camera:', error)
        });
      } else {
        // Adding new camera - convert to FormData
        const formData = new FormData();
        Object.keys(cameraData).forEach(key => {
          if (key === 'additionalProjects') {
            formData.append(key, JSON.stringify(cameraData[key]));
          } else {
            formData.append(key, cameraData[key]);
          }
        });
        this.cameraService.addCamera(formData).subscribe({
          next: () => this.router.navigate(['/cameras']),
          error: (error) => console.error('Error adding camera:', error)
        });
      }
    }
  }

  onCancel(): void {
    this.router.navigate(['/cameras']);
  }
}

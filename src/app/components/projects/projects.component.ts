import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormField } from '@angular/material/input';
import { MatInputModule } from '@angular/material/input';
import { MatLabel } from '@angular/material/input';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DeveloperService } from '../../services/developer.service';
import { ProjectService } from '../../services/project.service';
import { Developer } from '../../models/developer.model';
import { Project } from '../../models/project.model';
import { MatSelectModule } from '@angular/material/select'; // Import for dropdown
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProjectFormComponent } from './project-form/project-form.component';
import { environment } from '../../../environment/environments';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CameraService } from '../../services/camera.service';
import { Camera } from '../../models/camera.model';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';


@Component({
  selector: 'app-developers',
  standalone: true,
  imports: [FormsModule, CommonModule, MatFormField, MatInputModule, 
    MatLabel, MatSort, MatTableModule, MatIcon, MatIconModule, MatSelectModule, MatProgressSpinnerModule, MatButtonModule, MatDialogModule, MatSnackBarModule, MatTooltipModule, ConfirmDialogComponent],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {
  displayedColumns: string[] = ['logo', 'name', 'createdDate', 'actions'];
  dataSource = new MatTableDataSource<Project>();
  developers: Developer[] = []; // List of developers for dropdown
  selectedDeveloperId: string = ''; // Holds the currently selected developer ID
  searchTerm: string = '';
  isLoading: boolean = false;  // Loading state
  link:string = environment.backend;


  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private developerService: DeveloperService, 
    private projectService: ProjectService,  
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cameraService: CameraService
  ) {}

  ngOnInit(): void {
    this.fetchDevelopers();
  }

  // Fetch the list of developers
  fetchDevelopers(): void {
    this.developerService.getAllDevelopers().subscribe((developers) => {
      this.developers = developers;
      // Automatically select the first developer by default
      if (developers.length > 0) {
        this.selectedDeveloperId = developers[0]._id;
        this.fetchProjectsByDeveloper(this.selectedDeveloperId);
      }
    });
  }

  // Fetch projects for the selected developer
  fetchProjectsByDeveloper(developerId: string): void {
    this.isLoading = true;  // Set loading to true when a new developer is selected

    this.projectService.getProjectsByDeveloper(developerId).subscribe({
      next: (projects) => {
        this.dataSource.data = projects;
        this.dataSource.sort = this.sort;
      },
      complete: () => (this.isLoading = false)  // Set loading to false once data is loaded
    });    
  }

  // Apply filter for search functionality
  applyFilter(): void {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
  }

  // Add new project action
  openAddProjectDialog(): void {
    const dialogRef = this.dialog.open(ProjectFormComponent, {
      data: { isEditMode: false, developerId: this.selectedDeveloperId },
      panelClass: 'custom-dialog-container',
      // width: '700px',      // Set desired width
      // maxHeight: '80vh'   // Limit height to 80% of viewport height
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchProjectsByDeveloper(this.selectedDeveloperId);  // Refresh list after adding a new developer
      }
    });
  }

   // Open the form in "Edit" mode
   openEditProjectDialog(project: Project): void {
    const dialogRef = this.dialog.open(ProjectFormComponent, {
      data: { isEditMode: true, project },
      panelClass: 'custom-dialog-container',
      // width: '700px',      // Set desired width
      // maxHeight: '80vh'   // Limit height to 80% of viewport height
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchProjectsByDeveloper(this.selectedDeveloperId);  // Refresh list after editing a developer
      }
    });
  }

  toggleBlockStatus(project: any): void {
    project.blocked = !project.blocked; // Toggle the blocked field
    this.saveBlockStatus(project); // Save the updated status
  }
  
  saveBlockStatus(project: any): void {
    // Replace with your service call to save the project
    this.projectService.updateProjectStatus(project._id, { blocked: project.blocked }).subscribe({
      next: (response) => {
        console.log(`Project ${project.projectName} updated:`, response);
      },
      error: (error) => {
        console.error(`Error updating project ${project.projectName}:`, error);
        // Optionally, revert the change in case of an error
        project.blocked = !project.blocked;
      }
    });
  }

  updateProjectStatus(project: Project): void {
    this.projectService.updateProjectStatus(project._id, { status: project.status }).subscribe({
      next: (response) => {
        console.log(`Project ${project.projectName} status updated to ${project.status}`);
      },
      error: (error) => {
        console.error(`Error updating project ${project.projectName} status:`, error);
        // Optionally, revert the change in case of an error
        this.fetchProjectsByDeveloper(this.selectedDeveloperId);
      }
    });
  }

  // Check if project is RAM (should not be deletable)
  isRAMProject(project: Project): boolean {
    return project.projectName?.toUpperCase() === 'RAM' || project.projectTag?.toLowerCase() === 'ram';
  }

  // Delete project with validation
  deleteProject(project: Project): void {
    // Prevent deletion of RAM project
    if (this.isRAMProject(project)) {
      this.snackBar.open('Cannot delete RAM project. This project is protected.', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Check for cameras associated with this project
    // We need to check all cameras, not just those with this project as main project
    this.cameraService.getAllCameras().subscribe({
      next: (allCameras: Camera[]) => {
        // Check if any camera has this project as main project
        const camerasWithMainProject = allCameras.filter(cam => cam.project === project._id);
        
        // Check if any camera has this project in additionalProjects
        const camerasWithAdditionalProject = allCameras.filter(cam => 
          cam.additionalProjects && cam.additionalProjects.includes(project._id)
        );

        if (camerasWithMainProject.length > 0) {
          // Cannot delete if it's the main project for any camera
          this.snackBar.open(
            `Cannot delete project "${project.projectName}". It is the main project for ${camerasWithMainProject.length} camera(s). Please reassign or delete the cameras first.`,
            'Close',
            {
              duration: 5000,
              panelClass: ['error-snackbar']
            }
          );
          return;
        }

        // Show confirmation dialog
        let message = `Are you sure you want to delete project "${project.projectName}"?`;
        if (camerasWithAdditionalProject.length > 0) {
          message += `\n\nWarning: This project will be removed from ${camerasWithAdditionalProject.length} camera(s) additional projects list.`;
        }

        const confirmDialog = this.dialog.open(ConfirmDialogComponent, {
          width: '400px',
          data: {
            title: 'Delete Project',
            message: message,
            confirmText: 'Delete',
            cancelText: 'Cancel'
          }
        });

        confirmDialog.afterClosed().subscribe(result => {
          if (result) {
            // Proceed with deletion
            this.projectService.deleteProject(project._id).subscribe({
              next: () => {
                this.snackBar.open(`Project "${project.projectName}" deleted successfully.`, 'Close', {
                  duration: 3000,
                  panelClass: ['success-snackbar']
                });
                // Refresh the project list
                this.fetchProjectsByDeveloper(this.selectedDeveloperId);
              },
              error: (error) => {
                console.error('Error deleting project:', error);
                this.snackBar.open(
                  `Error deleting project: ${error.error?.message || 'Unknown error'}`,
                  'Close',
                  {
                    duration: 5000,
                    panelClass: ['error-snackbar']
                  }
                );
              }
            });
          }
        });
      },
      error: (error) => {
        console.error('Error checking cameras:', error);
        // If we can't check cameras, still allow deletion but warn
        const confirmDialog = this.dialog.open(ConfirmDialogComponent, {
          width: '400px',
          data: {
            title: 'Delete Project',
            message: `Are you sure you want to delete project "${project.projectName}"?\n\nNote: Unable to verify camera associations.`,
            confirmText: 'Delete',
            cancelText: 'Cancel'
          }
        });

        confirmDialog.afterClosed().subscribe(result => {
          if (result) {
            this.projectService.deleteProject(project._id).subscribe({
              next: () => {
                this.snackBar.open(`Project "${project.projectName}" deleted successfully.`, 'Close', {
                  duration: 3000,
                  panelClass: ['success-snackbar']
                });
                this.fetchProjectsByDeveloper(this.selectedDeveloperId);
              },
              error: (error) => {
                console.error('Error deleting project:', error);
                this.snackBar.open(
                  `Error deleting project: ${error.error?.message || 'Unknown error'}`,
                  'Close',
                  {
                    duration: 5000,
                    panelClass: ['error-snackbar']
                  }
                );
              }
            });
          }
        });
      }
    });
  }

}

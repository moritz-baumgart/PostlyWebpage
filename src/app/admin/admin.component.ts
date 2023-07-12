import { Component } from '@angular/core';
import { SearchService } from '../search.service';
import { UserDTO } from 'src/DTOs/userdto';
import { FormControl } from '@angular/forms';
import { DatabaseService } from '../database.service';
import { EMPTY, catchError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent {

  mods: UserDTO[] | null = null

  sqlQueryForm = new FormControl('')
  executeBtnLoading = false

  resultColumns: string[] | null = null
  resultData: string[][] | null = null

  infoMsg: string | null = null
  errorMsgHeader: string | null = null
  errorMsgs: string[] | null = null

  constructor(searchService: SearchService, private databaseService: DatabaseService) {

    searchService.getModerators()
      .subscribe(res => { //TODO: Handle err
        this.mods = res
      })
  }

  execute() {

    if (this.executeBtnLoading || !this.sqlQueryForm.value) {
      return
    }
    this.executeBtnLoading = true

    this.resultColumns = null
    this.resultData = null
    this.infoMsg = null
    this.errorMsgHeader = null
    this.errorMsgs = null

    this.databaseService.executeQuery(this.sqlQueryForm.value)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          this.executeBtnLoading = false
          if (err.status == 400) {
            this.errorMsgHeader = 'The server returned the following error(s):'
            this.errorMsgs = err.error
          } else if (err.status == 500) {
            this.errorMsgHeader = 'The server returned an unknown error! Please check your query!'
          } else {
            this.errorMsgHeader = 'Error connecting to server. Please try again later!'
            console.error(err);
          }
          return EMPTY
        })
      )
      .subscribe(res => {
        if (res.hasResult) {
          this.resultColumns = res.columns
          this.resultData = res.result
        } else {
          this.infoMsg = `${res.affectedRows} rows were affected!`
        }
        this.executeBtnLoading = false
      })
  }
}

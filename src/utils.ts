import { MessageService } from "primeng/api";

export function showGeneralError(messageService: MessageService, message: string, severity = 'error', summary = 'Error') {
    messageService.add({
        severity,
        summary,
        detail: message
    })
}
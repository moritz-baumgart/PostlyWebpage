import { MessageService } from "primeng/api";

/**
 * Uses a given {@link MessageService} to create a new message.
 * @param messageService The message service to use for creating the message.
 * @param message The text content of the message.
 * @param severity The severity of the message.
 * @param summary The text content for the summary field of the message.
 */
export function showGeneralError(messageService: MessageService, message: string, severity: 'success' | 'info' | 'warn' | 'error' = 'error', summary = 'Error') {
    messageService.add({
        severity,
        summary,
        detail: message
    })
}
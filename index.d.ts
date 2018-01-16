/// <reference types="leaflet" />

import * as L from 'leaflet';

declare module 'leaflet' {

    namespace Control {

        interface SidebarOptions { // extends L.ControlOptions { // FIXME
            container?: HTMLElement | string,
            position?: 'left' | 'right',
            autopan?: boolean,
            closeButton?: boolean,
        }

        interface PanelOptions {
            id: string,
            tab: HTMLElement | string,
            panel?: HTMLElement | string,
            button?: EventListener,
            disabled?: boolean,
            position?: 'top' | 'bottom',
            title?: string,
        }

        type SidebarEvents = 'opening' | 'closing' | 'content'

        type SidebarEventHandlerFnMap = {
            'opening'?: L.LeafletEventHandlerFn,
            'closing'?: L.LeafletEventHandlerFn,
            'content'?: L.LeafletEventHandlerFn,
        }

        export class Sidebar extends L.Evented { // extends L.Control { // FIXME
            constructor(options?: SidebarOptions);
            options: SidebarOptions;

            addTo(map: L.Map): this;
            removeFrom(map: L.Map): this;

            open(id: string): this;
            close(): this;

            addPanel(data: PanelOptions): this;
            removePanel(id: string): this;

            enablePanel(id: string): this;
            disablePanel(id: string): this;

            on(type: SidebarEvents, fn: L.LeafletEventHandlerFn, context?: any): this;
            on(eventMap: SidebarEventHandlerFnMap): this;
        }

    }

    namespace control {
        export function sidebar(options?: Control.SidebarOptions): Control.Sidebar;
    }
}

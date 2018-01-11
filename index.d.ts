/// <reference types="leaflet" />

import * as L from 'leaflet';

declare module 'leaflet' {
    namespace control {
        class Sidebar extends L.Control {
            constructor(options?: SidebarOptions, deprecatedOptions?: SidebarOptions);

            onAdd(map: L.Map): any;
            onRemove(map: L.Map): this;
            addTo(map: L.Map): this;
            open(id: string): this;
            close(): this;
            onCloseClick(): this;

            addPanel(data: any): this;
            removePanel(id: string): this;
            enablePanel(id: string): this;
            disablePanel(id: string): this;
        }

        interface SidebarOptions {
            id: string;
            position?: string;
            autopan?: boolean;
            closeButton?: boolean;
        }

        function sidebar(options?: SidebarOptions, deprecatedOptions?: SidebarOptions): Sidebar;
    }
}

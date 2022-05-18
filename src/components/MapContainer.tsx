import React, { useRef, useEffect, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
// @ts-ignore
import mapboxgl, {Map, Marker, Popup} from "!mapbox-gl";
import {graphql, useStaticQuery} from "gatsby"; // eslint-disable-line import/no-webpack-loader-syntax

mapboxgl.accessToken = 'pk.eyJ1IjoiYXJ0aHVydmlvbHkiLCJhIjoiY2wzYWx6M2swMDA2ODNjb2hpazZtMmgzayJ9.BAx3V9_sDBz8ZCyVm3Unrw';
const dublinLngLatBoundsLike = [[-6.332588195800781,53.24856941172296],[-6.192684173583984,53.39913021659171]]

export const MapContainer = () => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const {notes} = useStaticQuery(graphql`
        {
            notes:allMarkdownRemark {
                nodes {
                    id
                    frontmatter {
                        title
                        type
                        part
                        episode
                        point
                        linestring
                        raster_nw
                        raster_sw
                        raster_se
                        raster_image {
                            publicURL
                        }
                    }
                    excerpt
                }
            }
        }
    `)

    useEffect(() => {
        if (map.current) return; // initialize map only once
       const currentMap = map.current = new Map({
            container: mapContainer.current,
            //style: 'mapbox://styles/mapbox/streets-v11',
            style: 'mapbox://styles/arthurvioly/cl3an177b000h14mypn277bst',
            bounds: dublinLngLatBoundsLike,
            fitBoundsOptions: {
                 padding: 40
            }
        })

        const roman_parts = [
            {
                color:'#3366ee'
            },
            {
                color:'#ee3333'
            }
        ]
        const pathsGeojson = {
            type:'FeatureCollection',
            features:[]
        }
        const markersGeojson = {
            type:'FeatureCollection',
            features:[]
        }
        currentMap.on('load',function(){

            // @ts-ignore
            currentMap.getStyle().layers.forEach((l)=>{
                console.log(l.id,l.type)
            })

            // @ts-ignore
            notes.nodes.forEach((note)=>{
                const {frontmatter, excerpt, id} = note
                const {
                    title,
                    type,
                    part,
                    point,
                    linestring,
                    raster_nw,
                    raster_sw,
                    raster_se,
                    raster_image,
                } = frontmatter
                const part_color = roman_parts[part-1].color || "#000"
                let feature;
                switch (type){
                    case 'Marker':
                        feature = {
                            type:'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: point
                            },
                            properties:{
                                title:title,
                                color:part_color
                            }
                        }
                        // @ts-ignore
                        markersGeojson.features.push(feature)
                        break;
                    case 'Path':
                        feature = {
                            type:'Feature',
                            geometry: {
                                type: 'LineString',
                                coordinates: linestring
                            },
                            properties:{
                                title:title,
                                color:part_color
                            }
                        }
                        // @ts-ignore
                        pathsGeojson.features.push(feature)
                        break;
                    case 'Raster':
                        let imageURL = location.origin+raster_image.publicURL;
                        // @ts-ignore
                        const raster_coordinates = [
                            raster_nw,
                            [raster_se[0],raster_nw[1]],
                            raster_se,
                            [raster_nw[0],raster_se[1]],
                        ];
                        // @ts-ignore
                        currentMap.addSource(`raster${id}`, {
                            'type': 'image',
                            'url': imageURL,
                            'coordinates': raster_coordinates
                        });
                        currentMap.addLayer({
                            id: `raster${id}`,
                            'type': 'raster',
                            'source': `raster${id}`,
                            'paint': {
                                'raster-fade-duration': 0,
                                //'raster-brightness-max': 0.5,
                                'raster-opacity':[
                                    'interpolate',
                                    ['exponential', 0.5],
                                    ['zoom'],
                                    10, .1,
                                    14, .9,
                                    22, .2
                                ],
                            }
                        },'bridge-simple');
                }
            })

            currentMap.addSource('paths',{
                type:'geojson',
                data: pathsGeojson
            })
            currentMap.addSource('markers',{
                type:'geojson',
                data: markersGeojson
            })

            currentMap.addLayer({
                'id': 'paths',
                'type': 'line',
                'source': 'paths',
                'paint': {
                    'line-color': ['get','color'],
                    'line-width': [
                        'interpolate',
                        ['exponential', 0.5],
                        ['zoom'],
                        10, 2,
                        18, 4,
                        20, 10
                    ],
                },
            },'road-label-simple')

            currentMap.addLayer({
                'id': 'paths_label',
                'type': 'symbol',
                'source': 'paths',
                'layout':{
                    'text-field': '{title}',
                    'text-anchor': 'center',
                    'symbol-placement':'line',
                    'text-size': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        10, 8,
                        16, 12,
                        22, 22
                    ]
                },
                'paint': {
                    'text-halo-color': '#fff',
                    'text-halo-width': 2,
                    'text-color': ['get','color'],
                },
            })

            currentMap.addLayer({
                'id': 'markers',
                'type': 'circle',
                'source': 'markers',
                'paint': {
                    'circle-color': ['get','color'],
                    'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        8, 0,
                        18, 12,
                        20, 16
                    ],
                },
            },'road-label-simple')

            currentMap.addLayer({
                'id': 'markers_label',
                'type': 'symbol',
                'source': 'markers',
                'layout':{
                    'text-field': '{title}',
                    'text-anchor': 'bottom',
                    'text-offset': [0,-1],
                    'text-size': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        10, 8,
                        22, 22
                    ]
                },
                'paint': {
                    'text-halo-color': '#fff',
                    'text-halo-width': 2,
                    'text-color': ['get','color'],
                },
            })
        })




    });

    return <div ref={mapContainer} className={"map-container"} />
}
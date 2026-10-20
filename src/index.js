import {SpaceX} from "./api/spacex";
import * as d3 from "d3";
import * as Geo from './geo.json'

const mapWidth = 640;
const mapHeight = 480;

document.addEventListener("DOMContentLoaded", setup)

function setup(){
    const space = new SpaceX();

    Promise.all([space.launches(), space.launchpads()])
        .then(makePageForData())
        .catch(err => console.error("Ошибка загрузки данных Launch Library:", err));

    function makePageForData() {
        return ([launchesData, padsData]) => {
            // console.log(launchesData.results);
            // console.log(padsData.results);
            renderLaunches(launchesData.results, document.getElementById("listContainer"));
            drawMap(padsData.results);
            attachHoverHandlers(launchesData.results);
        };
    }
}

function renderLaunches(launches, container){
    const list = document.createElement("ul");
    launches.forEach(launch=>{
        const item = getItemForLaunch(launch);
        list.appendChild(item);
    })
    container.replaceChildren(list);
}

function getItemForLaunch(launch) {
    const item = document.createElement("li");
    const padId = launch.pad.id;

    item.innerHTML = launch.name;
    item.setAttribute("data-pad-id", padId);
    item.style.cursor = "pointer";
    return item;
}

function drawMap(launchpads = []){
    const margin = {top: 20, right: 10, bottom: 40, left: 100};

    const svg = d3.select('#map').append("svg")
        .attr("width", mapWidth + margin.left + margin.right)
        .attr("height", mapHeight + margin.top + margin.bottom)
        .append("g")
        .attr("id", "mapGroup")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    const projection = d3.geoMercator()
        .scale(70)
        .center([0,20])
        .translate([mapWidth / 2 - margin.left, mapHeight / 2]);

    const path = d3.geoPath().projection(projection);

    // --- Страны / континенты ---
    svg.append("g")
        .selectAll("path")
        .data(Geo.features)
        .enter()
        .append("path")
        .attr("class", "topo")
        .attr("d", path)
        .attr("fill", () => colorScale(75))
        .style("opacity", .7);

    // --- Пусковые площадки ---
    const padsGeo = featureCollectionFrom(launchpads);

    const pointPath = d3.geoPath()
        .projection(projection)
        .pointRadius(5);

    svg.append("g")
        .attr("class", "launchpads")
        .selectAll("path")
        .data(padsGeo.features)
        .enter()
        .append("path")
        .attr("class", "launchpad")
        .attr("id", d => `pad-${d.properties.id}`)
        .attr("d", pointPath)
        .attr("fill", "tomato")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .append("title")
        .text(d => d.properties.name +
            (d.properties.locality ? " — " + d.properties.locality : ""));
}

function colorScale(value) {
    const color = d3.scaleSequential(d3.interpolateBlues)
        .domain([0, 100]);
    return color(value);
}

function featureCollectionFrom(launchpads) {
    return {
        type: "FeatureCollection",
        features: launchpads
            .filter(pad => pad.latitude != null && pad.longitude != null)
            .map(pad => ({
                type: "Feature",
                properties: {
                    name: pad.name,
                    locality: pad.locality,
                    region: pad.region
                },
                geometry: {
                    type: "Point",
                    coordinates: [Number(pad.longitude), Number(pad.latitude)]
                }
            }))
    };
}

function attachHoverHandlers(launches){
    document.querySelectorAll("#listContainer li").forEach(attachHoverHandler(launches));
}

function attachHoverHandler(launches) {
    return (item, index) => {
        const launch = launches[index];
        const padId = launch.pad.id;

        item.setAttribute("data-pad-id", padId);
        item.style.cursor = "pointer";

        item.addEventListener("mouseover", () => {
            if (padId) highlightLaunchpad(launch.pad);
        });

        item.addEventListener("mouseleave", () => {
            d3.select("#mapGroup .launchpads").selectAll(".launchpad-highlight").remove();
        });
    };
}

function highlightLaunchpad(pad){
    if (!pad.latitude || !pad.longitude) return;

    const { svg, pointPath } = getSvgAndPointPath();
    removePreviousPoints(svg);
    addNewPoint(svg, pointPath, pad);
}

function getSvgAndPointPath() {
    const projection = d3.geoMercator()
        .scale(70)
        .center([0, 20])
        .translate([mapWidth / 2 - 100, mapHeight / 2]);

    const pointPath = d3.geoPath()
        .projection(projection)
        .pointRadius(8);

    const svg = d3.select("#mapGroup .launchpads");
    return { svg, pointPath };
}

function removePreviousPoints(svg) {
    svg.selectAll(".launchpad-highlight").remove();
}

function addNewPoint(svg, pointPath, pad) {
    svg.append("path")
        .attr("class", "launchpad-highlight")
        .attr("d", pointPath({
            type: "Point",
            coordinates: [Number(pad.longitude), Number(pad.latitude)]
        }))
        .attr("fill", "gold")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .append("title")
        .text(pad.name + (pad.locality ? " — " + pad.locality : ""));
}


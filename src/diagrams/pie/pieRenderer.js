/** Created by AshishJ on 11-09-2019. */
import { select, scaleOrdinal, pie as d3pie, arc } from 'd3';
import pieData from './pieDb';
import pieParser from './parser/pie';
import { log } from '../../logger';
import { configureSvgSize } from '../../utils';
import * as configApi from '../../config';
import addSVGAccessibilityFields from '../../accessibility';

let conf = configApi.getConfig();

/**
 * Draws a Pie Chart with the data given in text.
 *
 * @param text
 * @param id
 */
let width;
const height = 450;
export const draw = (txt, id) => {
  try {
    conf = configApi.getConfig();
    const parser = pieParser.parser;
    parser.yy = pieData;
    log.debug('Rendering info diagram\n' + txt);

    const securityLevel = configApi.getConfig().securityLevel;
    // Handle root and ocument for when rendering in sanbox mode
    let sandboxElement;
    if (securityLevel === 'sandbox') {
      sandboxElement = select('#i' + id);
    }
    const root =
      securityLevel === 'sandbox'
        ? select(sandboxElement.nodes()[0].contentDocument.body)
        : select('body');
    const doc = securityLevel === 'sandbox' ? sandboxElement.nodes()[0].contentDocument : document;

    // Parse the Pie Chart definition
    parser.yy.clear();
    parser.parse(txt);
    log.debug('Parsed info diagram');
    const elem = doc.getElementById(id);
    width = elem.parentElement.offsetWidth;

    if (typeof width === 'undefined') {
      width = 1200;
    }

    if (typeof conf.useWidth !== 'undefined') {
      width = conf.useWidth;
    }
    if (typeof conf.pie.useWidth !== 'undefined') {
      width = conf.pie.useWidth;
    }

    const diagram = root.select('#' + id);
    configureSvgSize(diagram, height, width, conf.pie.useMaxWidth);

    addSVGAccessibilityFields(parser.yy, diagram, id);
    // Set viewBox
    elem.setAttribute('viewBox', '0 0 ' + width + ' ' + height);

    // Fetch the default direction, use TD if none was found
    var margin = 40;
    var legendRectSize = 18;
    var legendSpacing = 4;

    var radius = Math.min(width, height) / 2 - margin;

    var svg = diagram
      .append('g')
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    var data = pieData.getSections();
    var sum = 0;
    Object.keys(data).forEach(function (key) {
      sum += data[key];
    });

    const themeVariables = conf.themeVariables;
    var myGeneratedColors = [
      themeVariables.pie1,
      themeVariables.pie2,
      themeVariables.pie3,
      themeVariables.pie4,
      themeVariables.pie5,
      themeVariables.pie6,
      themeVariables.pie7,
      themeVariables.pie8,
      themeVariables.pie9,
      themeVariables.pie10,
      themeVariables.pie11,
      themeVariables.pie12,
    ];

    // Set the color scale
    var color = scaleOrdinal().range(myGeneratedColors);

    // Compute the position of each group on the pie:
    var pie = d3pie().value(function (d) {
      return d[1];
    });
    var dataReady = pie(Object.entries(data));

    // Shape helper to build arcs:
    var arcGenerator = arc().innerRadius(0).outerRadius(radius);

    // Build the pie chart: each part of the pie is a path that we build using the arc function.
    svg
      .selectAll('mySlices')
      .data(dataReady)
      .enter()
      .append('path')
      .attr('d', arcGenerator)
      .attr('fill', function (d) {
        return color(d.data[0]);
      })
      .attr('class', 'pieCircle');

    // Now add the percentage.
    // Use the centroid method to get the best coordinates.
    svg
      .selectAll('mySlices')
      .data(dataReady)
      .enter()
      .append('text')
      .text(function (d) {
        return ((d.data[1] / sum) * 100).toFixed(0) + '%';
      })
      .attr('transform', function (d) {
        return 'translate(' + arcGenerator.centroid(d) + ')';
      })
      .style('text-anchor', 'middle')
      .attr('class', 'slice');

    svg
      .append('text')
      .text(parser.yy.getDiagramTitle())
      .attr('x', 0)
      .attr('y', -(height - 50) / 2)
      .attr('class', 'pieTitleText');

    // Add the legends/annotations for each section
    var legend = svg
      .selectAll('.legend')
      .data(color.domain())
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', function (d, i) {
        var height = legendRectSize + legendSpacing;
        var offset = (height * color.domain().length) / 2;
        var horz = 12 * legendRectSize;
        var vert = i * height - offset;
        return 'translate(' + horz + ',' + vert + ')';
      });

    legend
      .append('rect')
      .attr('width', legendRectSize)
      .attr('height', legendRectSize)
      .style('fill', color)
      .style('stroke', color);

    legend
      .data(dataReady)
      .append('text')
      .attr('x', legendRectSize + legendSpacing)
      .attr('y', legendRectSize - legendSpacing)
      .text(function (d) {
        if (parser.yy.getShowData() || conf.showData || conf.pie.showData) {
          return d.data[0] + ' [' + d.data[1] + ']';
        } else {
          return d.data[0];
        }
      });
  } catch (e) {
    log.error('Error while rendering info diagram');
    log.error(e);
  }
};

export default {
  draw,
};

This project [custom-portal-ng](https://github.com/DomDerrien/custom-portal-ng)
is an update of the original [custom-portal](https://github.com/DomDerrien/custom-portal).
If the first one was meant to be a replacement of the now defunct Google Bookmark service,
I plan to also embed video players (Youtube, Vimeo) and Google Docs document preview.
If the development progress steadily, I'll integrate an application for Google Voice assistant.

# Technology stacks

<div style="display: flex; width: 100%;">
    <div style="width: 50%;border:">
        <h2>Custom Portal</h2>
        <ul>
            <li>Platform: Google App Engine Standard</li>
            <li>Back-end: Java w/ Google Datastore</li>
            <li>Front-end: Dojo Toolkit + Bootstrap</li>
        </ul>
    </div>
    <div style="width: 50%;;border:">
        <h2>Custom Portal NG</h2>
        <ul>
            <li>Platform: Google App Engine Standard</li>
            <li>Back-end: Typescript (transpiled in ES6 w/ CommonJS for Node.js) w/ Google Datastore</li>
            <li>Front-end: Typescript (transpiled in ES7 w/ modules) on the top of Polymer 3</li>
        </ul>
    </div>
</div>
